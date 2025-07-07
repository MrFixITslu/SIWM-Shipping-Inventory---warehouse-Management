// backend/services/inventoryService.js
const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const { sendEvent } = require('./sseService');

// This function works with snake_case DB data
const _deriveQuantity = (dbItem) => {
    if (dbItem.is_serialized) {
        return (dbItem.serial_numbers || []).length;
    }
    return dbItem.quantity !== null && dbItem.quantity !== undefined ? dbItem.quantity : 0;
};

// This function now takes snake_case DB data and returns a fully mapped camelCase app object
const mapDbItemToAppItem = (dbItem) => {
    if (!dbItem) return null;
    const appItem = mapToCamel(dbItem);
    appItem.quantity = _deriveQuantity(dbItem); // Override quantity with derived value
    if (appItem.entryDate) appItem.entryDate = new Date(appItem.entryDate).toISOString().split('T')[0];
    if (appItem.lastMovementDate) appItem.lastMovementDate = new Date(appItem.lastMovementDate).toISOString().split('T')[0];
    return appItem;
};


const getAllInventoryItems = async () => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM inventory_items ORDER BY name ASC');
  return res.rows.map(mapDbItemToAppItem);
};

const getInventoryItemById = async (id) => {
  const pool = getPool();
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) throw new Error('Invalid inventory item ID format');
  const res = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [itemId]);
  return mapDbItemToAppItem(res.rows[0]);
};

const createInventoryItem = async (itemData) => { // Expects camelCase
  const pool = getPool();
  const dbData = mapToSnake(itemData);
  const { sku, name, category, location, reorder_point, is_serialized, serial_numbers, cost_price, entry_date, last_movement_date, image_url, safety_stock, primary_vendor_id } = dbData;
  let quantity = dbData.quantity;

  if (is_serialized) {
    quantity = (serial_numbers && Array.isArray(serial_numbers)) ? serial_numbers.length : 0;
  }

  // Set default safety stock if not provided
  const safetyStock = safety_stock || Math.max(Math.floor(reorder_point * 0.2), 10);

  const res = await pool.query(
    'INSERT INTO inventory_items (sku, name, category, quantity, location, reorder_point, is_serialized, serial_numbers, cost_price, entry_date, last_movement_date, image_url, safety_stock, primary_vendor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    [sku, name, category, quantity, location, reorder_point, is_serialized, serial_numbers || null, cost_price, entry_date, last_movement_date, image_url, safetyStock, primary_vendor_id || null]
  );
  const newItem = mapDbItemToAppItem(res.rows[0]);
  sendEvent('inventory_created', newItem);
  return newItem;
};

const updateInventoryItem = async (id, updatedData) => { // Expects camelCase
  const pool = getPool();
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) throw new Error('Invalid inventory item ID format');

  const currentItemDb = (await pool.query('SELECT * FROM inventory_items WHERE id = $1', [itemId])).rows[0];
  if (!currentItemDb) return null;

  const dbData = mapToSnake(updatedData);
  
  // Handle quantity derivation based on is_serialized and serial_numbers
  const isSerialized = dbData.hasOwnProperty('is_serialized') ? dbData.is_serialized : currentItemDb.is_serialized;
  if (isSerialized) {
    if (dbData.hasOwnProperty('serial_numbers')) {
        dbData.quantity = (dbData.serial_numbers || []).length;
    } else {
        dbData.quantity = (currentItemDb.serial_numbers || []).length;
    }
  }

  // If changing to non-serialized, explicitly clear out serial numbers to prevent orphaned data.
  if (dbData.hasOwnProperty('is_serialized') && dbData.is_serialized === false) {
    dbData.serial_numbers = null;
  }
  
  const fields = [];
  const values = [];
  let paramCount = 1;
  for (const key in dbData) {
    if (Object.prototype.hasOwnProperty.call(dbData, key) && key !== 'id') {
      fields.push(`${key} = $${paramCount++}`);
      values.push(dbData[key]);
    }
  }

  if (fields.length === 0) return mapDbItemToAppItem(currentItemDb);

  values.push(itemId);
  const queryText = `UPDATE inventory_items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const res = await pool.query(queryText, values);
  const updatedItem = mapDbItemToAppItem(res.rows[0]);
  sendEvent('inventory_updated', updatedItem);
  return updatedItem;
};

const decreaseStock = async(itemId, quantityToDecrease) => {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const itemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [itemId]);
        const item = itemRes.rows[0];
        if (!item) throw new Error(`Item ${itemId} not found for stock update.`);
        if (item.is_serialized) throw new Error(`Cannot decrease stock for serialized item ${itemId} with this function.`);
        if (item.quantity < quantityToDecrease) throw new Error(`Not enough stock for item ${item.name}. Available: ${item.quantity}, Requested: ${quantityToDecrease}`);

        const newQuantity = item.quantity - quantityToDecrease;
        const updateRes = await client.query(
            'UPDATE inventory_items SET quantity = $1, last_movement_date = CURRENT_DATE WHERE id = $2 RETURNING *',
            [newQuantity, itemId]
        );
        await client.query('COMMIT');
        
        const updatedItem = mapDbItemToAppItem(updateRes.rows[0]);
        sendEvent('inventory_updated', updatedItem);
        
        console.log(`Stock for item ${item.name} (ID: ${itemId}) decreased by ${quantityToDecrease}. New quantity: ${newQuantity}`);
        return updatedItem;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const deleteInventoryItem = async (id) => {
  const pool = getPool();
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) throw new Error('Invalid inventory item ID format');
  
  // The database schema now uses ON DELETE SET NULL for warehouse_order_items
  // and asn_items, so a direct delete is safe and will not violate foreign key constraints.
  // The pre-flight checks are no longer necessary.

  const res = await pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING id', [itemId]);
  if (res.rowCount > 0) {
    sendEvent('inventory_deleted', { id: itemId });
    return true;
  }
  return false;
};

const manageSerials = async (id, newSerials) => {
  const pool = getPool();
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) throw new Error('Invalid inventory item ID format');

  const item = await getInventoryItemById(id);
  if (!item) throw new Error('Inventory item not found.');
  if (!item.isSerialized) {
    throw new Error('Cannot manage serials for a non-serialized item.');
  }

  const newQuantity = (newSerials || []).length;
  const res = await pool.query(
    'UPDATE inventory_items SET serial_numbers = $1, quantity = $2, last_movement_date = CURRENT_DATE WHERE id = $3 RETURNING *',
    [newSerials, newQuantity, itemId]
  );
  
  const updatedItem = mapDbItemToAppItem(res.rows[0]);
  sendEvent('inventory_updated', updatedItem);
  return updatedItem;
};

const getUniqueCategories = async () => {
    const pool = getPool();
    const res = await pool.query("SELECT DISTINCT category FROM inventory_items WHERE category IS NOT NULL AND category <> '' ORDER BY category");
    return res.rows.map(row => row.category);
};

module.exports = {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  decreaseStock,
  manageSerials,
  getUniqueCategories,
};