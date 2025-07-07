

const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const userService = require('./userService');
const notificationService = require('./notificationServiceBackend');
const { sendEvent } = require('./sseService');

const _updateUnacknowledgedCount = async () => {
    try {
        const pool = getPool();
        const res = await pool.query("SELECT COUNT(*) FROM warehouse_orders WHERE status = 'Pending'");
        const count = parseInt(res.rows[0].count, 10);
        sendEvent('unacknowledged_orders_count_changed', { count });
    } catch (e) {
        console.error("[SSE Error] Failed to send unacknowledged orders count:", e);
    }
};

const parseHistory = (historyField) => {
    if (!historyField) return [];
    if (Array.isArray(historyField)) return historyField;
    if (typeof historyField === 'string') {
        try {
            const parsed = JSON.parse(historyField);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
};


const mapDbOrderToAppOrder = (dbOrder) => {
    if (!dbOrder) return null;
    const appOrder = mapToCamel(dbOrder);
    if(appOrder.createdAt) appOrder.createdAt = new Date(appOrder.createdAt).toISOString();
    
    appOrder.statusHistory = parseHistory(appOrder.statusHistory);

    return appOrder;
};

const mapDbOrderItemToAppOrderItem = (dbOrderItem) => {
    if (!dbOrderItem) return null;
    const appItem = mapToCamel(dbOrderItem);
    // Explicitly map inventoryItemId to itemId for frontend compatibility
    if (appItem.inventoryItemId) {
        appItem.itemId = appItem.inventoryItemId;
        delete appItem.inventoryItemId;
    }
    if(!appItem.pickedSerialNumbers) appItem.pickedSerialNumbers = [];
    return appItem;
};

const _deriveQuantity = (dbItem) => {
    if (dbItem.is_serialized) {
        return dbItem.serial_numbers ? dbItem.serial_numbers.length : 0;
    }
    return dbItem.quantity !== null && dbItem.quantity !== undefined ? dbItem.quantity : 0;
};
const mapDbItemToAppItem = (dbItem) => {
    if (!dbItem) return null;
    const appItem = mapToCamel(dbItem);
    appItem.quantity = _deriveQuantity(dbItem);
    if (appItem.entryDate) appItem.entryDate = new Date(appItem.entryDate).toISOString().split('T')[0];
    if (appItem.lastMovementDate) appItem.lastMovementDate = new Date(appItem.lastMovementDate).toISOString().split('T')[0];
    return appItem;
};


const getAllOrders = async () => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM warehouse_orders ORDER BY created_at DESC');
  const orders = await Promise.all(res.rows.map(async dbOrder => {
      const order = mapDbOrderToAppOrder(dbOrder);
      const itemsRes = await pool.query('SELECT * FROM warehouse_order_items WHERE order_id = $1', [order.id]);
      order.items = itemsRes.rows.map(mapDbOrderItemToAppOrderItem);
      return order;
  }));
  return orders;
};

const getOrderById = async (id) => {
  const pool = getPool();
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) throw new Error('Invalid Order ID format');

  const orderRes = await pool.query('SELECT * FROM warehouse_orders WHERE id = $1', [orderId]);
  if (orderRes.rows.length === 0) return null;
  
  const order = mapDbOrderToAppOrder(orderRes.rows[0]);

  const itemsRes = await pool.query('SELECT * FROM warehouse_order_items WHERE order_id = $1', [orderId]);
  order.items = itemsRes.rows.map(mapDbOrderItemToAppOrderItem);
  
  return order;
};

const createOrder = async (orderData, actingUserId) => {
  const pool = getPool();
  const client = await pool.connect();
  const { department, items, priority, status = 'Pending', technicianId } = orderData;

  try {
    await client.query('BEGIN');
    
    // --- Stock Validation ---
    for (const item of items) {
        const invItemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [item.itemId]);
        if (invItemRes.rows.length === 0) throw new Error(`Inventory item with ID ${item.itemId} not found.`);
        const invItem = invItemRes.rows[0];
        if (invItem.is_serialized) {
            // For serialized, just ensure it exists. Actual serials are picked later.
        } else {
            if (invItem.quantity < item.quantity) throw new Error(`Not enough stock for non-serialized item '${invItem.name}'. Available: ${invItem.quantity}, Requested: ${item.quantity}`);
        }
    }

    const actingUser = await userService.findUserById(actingUserId);
    const initialStatusHistory = [{ status, timestamp: new Date().toISOString(), userId: actingUserId, userName: actingUser.name }];
    const pickerName = technicianId ? (await userService.findUserById(technicianId))?.name : null;
    
    const orderRes = await client.query(
      'INSERT INTO warehouse_orders (department, priority, status, technician_id, picker, status_history) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [department, priority, status, technicianId, pickerName, JSON.stringify(initialStatusHistory)]
    );
    const newOrder = mapDbOrderToAppOrder(orderRes.rows[0]);

    if (Array.isArray(items) && items.length > 0) {
      newOrder.items = [];
      for (const item of items) {
        const dbItem = mapToSnake(item);
        const itemRes = await client.query(
          'INSERT INTO warehouse_order_items (order_id, inventory_item_id, quantity, name, picked_serial_numbers) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [newOrder.id, item.itemId, dbItem.quantity, dbItem.name, dbItem.picked_serial_numbers || null]
        );
        newOrder.items.push(mapDbOrderItemToAppOrderItem(itemRes.rows[0]));
      }
    }
    
    await client.query('COMMIT');
    sendEvent('order_created', newOrder);
    await _updateUnacknowledgedCount();
    return newOrder;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error in createOrder:", e);
    throw e;
  } finally {
    client.release();
  }
};

const updateOrder = async (id, updatedData, actingUserId) => {
  const pool = getPool();
  const client = await pool.connect();
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) throw new Error('Invalid Order ID format');

  try {
    await client.query('BEGIN');
    const currentOrderRes = await client.query('SELECT * FROM warehouse_orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (currentOrderRes.rows.length === 0) throw new Error('Order not found for update');
    
    const currentOrder = currentOrderRes.rows[0];
    const oldStatus = currentOrder.status;
    const newStatus = updatedData.status || oldStatus;

    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
        const itemsToRestockRes = await client.query('SELECT * FROM warehouse_order_items WHERE order_id = $1', [orderId]);
        for (const item of itemsToRestockRes.rows) {
            const invItemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [item.inventory_item_id]);
            const invItem = invItemRes.rows[0];
            if (!invItem) {
                console.warn(`Inventory item with ID ${item.inventory_item_id} not found during restock for cancelled order ${orderId}. Skipping.`);
                continue;
            }

            if (invItem.is_serialized) {
                const pickedSerials = item.picked_serial_numbers || [];
                if (pickedSerials.length > 0) {
                    const existingSerials = new Set(invItem.serial_numbers || []);
                    pickedSerials.forEach(sn => existingSerials.add(sn));
                    const newSerials = Array.from(existingSerials);
                    await client.query('UPDATE inventory_items SET serial_numbers = $1, quantity = $2, last_movement_date = CURRENT_DATE WHERE id = $3', [newSerials, newSerials.length, item.inventory_item_id]);
                }
            } else {
                await client.query('UPDATE inventory_items SET quantity = quantity + $1, last_movement_date = CURRENT_DATE WHERE id = $2', [item.quantity, item.inventory_item_id]);
            }
        }
    }

    if (newStatus === 'Ready for Pick-up' && oldStatus !== 'Ready for Pick-up') {
        const itemsToProcess = updatedData.items;
        if (!Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
            throw new Error("Cannot mark order as 'Ready for Pick-up' without a valid items array.");
        }

        for (const item of itemsToProcess) {
            const invItemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [item.itemId]);
            const invItem = invItemRes.rows[0];
            if (!invItem) throw new Error(`Inventory item with ID ${item.itemId} not found.`);
            
            if (invItem.is_serialized) {
                const pickedSerials = item.pickedSerialNumbers || [];
                if (pickedSerials.length !== item.quantity) throw new Error(`Must pick exactly ${item.quantity} serials for ${invItem.name}.`);
                
                const existingSerials = new Set((invItem.serial_numbers || []).map(sn => sn.toUpperCase()));
                const upperPickedSerials = pickedSerials.map(sn => sn.toUpperCase());

                upperPickedSerials.forEach(sn => {
                    if (!existingSerials.has(sn)) throw new Error(`Serial number ${sn} for item ${invItem.name} not found in stock or is already picked.`);
                });
                const newSerials = Array.from(existingSerials).filter(sn => !upperPickedSerials.includes(sn));
                
                await client.query('UPDATE inventory_items SET serial_numbers = $1, quantity = $2, last_movement_date = CURRENT_DATE WHERE id = $3', [newSerials, newSerials.length, item.itemId]);
            } else {
                if (invItem.quantity < item.quantity) throw new Error(`Not enough stock for non-serialized item '${invItem.name}'. Available: ${invItem.quantity}, Requested: ${item.quantity}`);
                await client.query('UPDATE inventory_items SET quantity = quantity - $1, last_movement_date = CURRENT_DATE WHERE id = $2', [item.quantity, item.itemId]);
            }
        }
    }
    
    const dbData = mapToSnake(updatedData);
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    for (const key of ['department', 'priority', 'status', 'technician_id', 'picker']) {
        if (dbData.hasOwnProperty(key)) {
            fieldsToUpdate.push(`${key} = $${paramCount++}`);
            values.push(dbData[key]);
        }
    }
    
    const actingUser = await userService.findUserById(actingUserId);
    if (newStatus !== oldStatus) {
        const currentHistory = parseHistory(currentOrder.status_history);
        const newHistory = [...currentHistory, { status: newStatus, timestamp: new Date().toISOString(), userId: actingUserId, userName: actingUser.name }];
        fieldsToUpdate.push(`status_history = $${paramCount++}`);
        values.push(JSON.stringify(newHistory));
    }
    
    if (fieldsToUpdate.length > 0) {
        values.push(orderId);
        const updateQuery = `UPDATE warehouse_orders SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramCount}`;
        await client.query(updateQuery, values);
    }

    if (dbData.items && Array.isArray(dbData.items)) {
        await client.query('DELETE FROM warehouse_order_items WHERE order_id = $1', [orderId]);
        for (const item of updatedData.items) {
            const dbItem = mapToSnake(item);
            await client.query(
                'INSERT INTO warehouse_order_items (order_id, inventory_item_id, quantity, name, picked_serial_numbers) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.itemId, dbItem.quantity, dbItem.name, dbItem.picked_serial_numbers || null]
            );
        }
    }
    await client.query('COMMIT');

    const updatedOrder = await getOrderById(orderId); // Re-fetch to get full data

    if (newStatus !== oldStatus) {
        await _updateUnacknowledgedCount();
    }

    if (newStatus === 'Ready for Pick-up' && oldStatus !== 'Ready for Pick-up' && updatedOrder.technicianId) {
        await notificationService.addSystemAlert({
            severity: 'Info',
            message: `Your order #${updatedOrder.id} is ready for pickup.`,
            type: 'Order Ready for Pickup',
            detailsLink: `/orders#${updatedOrder.id}`,
            userId: updatedOrder.technicianId,
        });
    }

    sendEvent('order_updated', updatedOrder);
    return updatedOrder;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error in updateOrder:", e);
    throw e;
  } finally {
    client.release();
  }
};

const deleteOrder = async (id) => {
  const pool = getPool();
  const client = await pool.connect();
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) throw new Error('Invalid Order ID format');

  try {
    await client.query('BEGIN');
    
    const orderRes = await client.query('SELECT * FROM warehouse_orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return false;
    }
    const order = orderRes.rows[0];

    // If order was ready for pickup or beyond, restock items
    if (['Ready for Pick-up', 'Picked Up', 'Completed'].includes(order.status)) {
      const itemsRes = await client.query('SELECT * FROM warehouse_order_items WHERE order_id = $1', [orderId]);
      for (const item of itemsRes.rows) {
        const invItemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [item.inventory_item_id]);
        const invItem = invItemRes.rows[0];
        if (!invItem) continue;

        if (invItem.is_serialized) {
            const pickedSerials = item.picked_serial_numbers || [];
            if (pickedSerials.length > 0) {
                const existingSerials = new Set(invItem.serial_numbers || []);
                pickedSerials.forEach(sn => existingSerials.add(sn));
                const newSerials = Array.from(existingSerials);
                await client.query('UPDATE inventory_items SET serial_numbers = $1, quantity = $2, last_movement_date = CURRENT_DATE WHERE id = $3', [newSerials, newSerials.length, item.inventory_item_id]);
            }
        } else {
            await client.query('UPDATE inventory_items SET quantity = quantity + $1, last_movement_date = CURRENT_DATE WHERE id = $2', [item.quantity, item.inventory_item_id]);
        }
      }
    }
    
    const deleteRes = await client.query('DELETE FROM warehouse_orders WHERE id = $1', [orderId]);
    await client.query('COMMIT');
    
    if (deleteRes.rowCount > 0) {
        sendEvent('order_deleted', { id: orderId });
        await _updateUnacknowledgedCount();
        return true;
    }
    return false;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error in deleteOrder:", e);
    throw e;
  } finally {
    client.release();
  }
};

const getShippableOrders = async () => {
    const pool = getPool();
    const res = await pool.query("SELECT * FROM warehouse_orders WHERE status IN ('Packed', 'Ready for Pick-up') ORDER BY priority DESC, created_at ASC");
    const orders = await Promise.all(res.rows.map(async dbOrder => {
        const order = mapDbOrderToAppOrder(dbOrder);
        const itemsRes = await pool.query('SELECT * FROM warehouse_order_items WHERE order_id = $1', [order.id]);
        order.items = itemsRes.rows.map(mapDbOrderItemToAppOrderItem);
        return order;
    }));
    return orders;
};

const confirmPickup = async (orderId, actingUserId) => {
    const pool = getPool();
    const id = parseInt(orderId, 10);
    if (isNaN(id)) throw new Error('Invalid Order ID format.');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orderRes = await client.query("SELECT * FROM warehouse_orders WHERE id = $1 FOR UPDATE", [id]);
        if (orderRes.rows.length === 0) throw new Error('Order not found.');
        
        const currentOrder = orderRes.rows[0];
        if (currentOrder.status !== 'Ready for Pick-up') {
            throw new Error(`Order cannot be picked up from its current status: ${currentOrder.status}`);
        }

        const newStatus = 'Picked Up';
        const actingUser = await userService.findUserById(actingUserId);
        const newStatusHistory = parseHistory(currentOrder.status_history);
        newStatusHistory.push({ status: newStatus, timestamp: new Date().toISOString(), userId: actingUserId, userName: actingUser.name });
        
        await client.query(
            "UPDATE warehouse_orders SET status = $1, status_history = $2 WHERE id = $3",
            [newStatus, JSON.stringify(newStatusHistory), id]
        );

        await client.query('COMMIT');
        
        const updatedOrder = await getOrderById(id);
        sendEvent('order_updated', updatedOrder);
        return updatedOrder;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};


const confirmReceipt = async (orderId, actingUserId) => {
    const pool = getPool();
    const id = parseInt(orderId, 10);
    if (isNaN(id)) throw new Error('Invalid Order ID format.');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orderRes = await client.query("SELECT * FROM warehouse_orders WHERE id = $1 FOR UPDATE", [id]);
        if (orderRes.rows.length === 0) throw new Error('Order not found.');
        
        const currentOrder = orderRes.rows[0];
        if (currentOrder.status !== 'Picked Up' && currentOrder.status !== 'Delivered') { // Allow confirmation if delivered
            throw new Error(`Order cannot be marked as Completed from its current status: ${currentOrder.status}`);
        }

        const newStatus = 'Completed';
        const actingUser = await userService.findUserById(actingUserId);
        const newStatusHistory = parseHistory(currentOrder.status_history);
        newStatusHistory.push({ status: newStatus, timestamp: new Date().toISOString(), userId: actingUserId, userName: actingUser.name });
        
        await client.query(
            "UPDATE warehouse_orders SET status = $1, status_history = $2, completed_by_user_id = $3 WHERE id = $4",
            [newStatus, JSON.stringify(newStatusHistory), actingUserId, id]
        );
        
        const updatedOrder = await getOrderById(id);
        
        if (updatedOrder.technicianId) {
             await notificationService.addSystemAlert({
                severity: 'Info',
                message: `Your order #${updatedOrder.id} has been marked as completed.`,
                type: 'Order Completed',
                detailsLink: `/orders#${updatedOrder.id}`,
                userId: updatedOrder.technicianId,
            });
        }

        await client.query('COMMIT');
        
        sendEvent('order_updated', updatedOrder);
        return updatedOrder;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

module.exports = { 
  getAllOrders, 
  getOrderById, 
  createOrder, 
  updateOrder, 
  deleteOrder, 
  getShippableOrders,
  confirmPickup,
  confirmReceipt,
};
