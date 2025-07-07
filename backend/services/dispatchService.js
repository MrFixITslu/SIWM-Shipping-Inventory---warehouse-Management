

const { getPool } = require('../config/db');
const orderService = require('./orderService');
const notificationService = require('./notificationServiceBackend');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const { sendEvent } = require('./sseService');

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

const mapDbDispatchToAppDispatch = (dbDispatch) => {
    if (!dbDispatch) return null;
    const appDispatch = mapToCamel(dbDispatch);
    if(appDispatch.dispatchDate) appDispatch.dispatchDate = new Date(appDispatch.dispatchDate).toISOString().split('T')[0];
    if(appDispatch.estimatedDeliveryDate) appDispatch.estimatedDeliveryDate = new Date(appDispatch.estimatedDeliveryDate).toISOString().split('T')[0];
    if(appDispatch.actualDeliveryDate) appDispatch.actualDeliveryDate = new Date(appDispatch.actualDeliveryDate).toISOString().split('T')[0];
    if (appDispatch.createdAt) {
      appDispatch.createdAt = new Date(appDispatch.createdAt).toISOString();
    }
    if(!appDispatch.shippedSerialNumbers) appDispatch.shippedSerialNumbers = {};
    if(!appDispatch.fees) appDispatch.fees = {};
    appDispatch.feeStatusHistory = parseHistory(appDispatch.feeStatusHistory);
    return appDispatch;
};

const getAllDispatches = async () => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM outbound_shipments ORDER BY dispatch_date DESC');
  return res.rows.map(mapDbDispatchToAppDispatch);
};

const getDispatchById = async (id) => {
  const pool = getPool();
  const dispatchId = parseInt(id, 10);
  if (isNaN(dispatchId)) throw new Error('Invalid Dispatch ID format');
  const res = await pool.query('SELECT * FROM outbound_shipments WHERE id = $1', [dispatchId]);
  return mapDbDispatchToAppDispatch(res.rows[0]);
};

const createDispatch = async (dispatchData) => {
  const pool = getPool();
  const client = await pool.connect();
  const dbData = mapToSnake(dispatchData);
  const { order_id, carrier, tracking_number, destination_address, dispatch_date, estimated_delivery_date, status = 'Preparing', shipped_serial_numbers, broker_id, broker_name, fee_status } = dbData;
  
  try {
      await client.query('BEGIN');
      if (order_id) {
          const order = await orderService.getOrderById(order_id);
          if (!order) throw new Error(`Order ${order_id} not found for dispatch.`);
          if (order.status !== 'Packed' && order.status !== 'Ready for Pick-up') {
            throw new Error(`Order ${order_id} is not in a shippable status.`);
          }
          await client.query( "UPDATE warehouse_orders SET status = $1, status_history = status_history || jsonb_build_object('status', $1, 'timestamp', $2) WHERE id = $3", ['Picked Up', new Date().toISOString(), order_id]);
          const updatedOrder = await orderService.getOrderById(order_id);
          sendEvent('order_updated', updatedOrder);
      }
      
      const res = await client.query( 'INSERT INTO outbound_shipments (order_id, carrier, tracking_number, destination_address, status, dispatch_date, estimated_delivery_date, shipped_serial_numbers, broker_id, broker_name, fee_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *', [order_id, carrier, tracking_number, destination_address, status, dispatch_date, estimated_delivery_date, shipped_serial_numbers || null, broker_id, broker_name, fee_status || 'Pending Submission']);
      await client.query('COMMIT');
      
      const newDispatch = mapDbDispatchToAppDispatch(res.rows[0]);
      sendEvent('dispatch_created', newDispatch);
      return newDispatch;
  } catch (e) {
      await client.query('ROLLBACK');
      throw e;
  } finally {
      client.release();
  }
};

const updateDispatch = async (id, updatedData) => {
  const pool = getPool();
  const dispatchId = parseInt(id, 10);
  if (isNaN(dispatchId)) throw new Error('Invalid Dispatch ID format');

  const currentDispatch = await getDispatchById(dispatchId);
  if (!currentDispatch) throw new Error('Dispatch not found for update.');

  if (updatedData.status === 'Delivered' && currentDispatch.status !== 'In Transit') {
    throw new Error('Can only mark as Delivered if shipment is currently In Transit.');
  }

  const dbData = mapToSnake(updatedData);
  const fields = Object.keys(dbData).filter(k => k !== 'id').map((key, i) => `${key} = $${i + 1}`);
  const values = Object.keys(dbData).filter(k => k !== 'id').map(key => dbData[key]);
  
  if (fields.length === 0) return getDispatchById(dispatchId);

  values.push(dispatchId);
  const queryText = `UPDATE outbound_shipments SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
  
  const res = await pool.query(queryText, values);
  const updated = mapDbDispatchToAppDispatch(res.rows[0]);
  
  if (updated && updated.status === 'Delivered' && updated.orderId) {
      if (!updated.actualDeliveryDate) {
        const actualDeliveryDate = new Date().toISOString().split('T')[0];
        await pool.query('UPDATE outbound_shipments SET actual_delivery_date = $1 WHERE id = $2', [actualDeliveryDate, updated.id]);
        updated.actualDeliveryDate = actualDeliveryDate;
      }
  }

  sendEvent('dispatch_updated', updated);
  return updated;
};

const deleteDispatch = async (id) => {
  const pool = getPool();
  const dispatchId = parseInt(id, 10);
  if (isNaN(dispatchId)) throw new Error('Invalid Dispatch ID format');
  const res = await pool.query('DELETE FROM outbound_shipments WHERE id = $1 RETURNING id', [dispatchId]);
  if (res.rowCount > 0) {
    sendEvent('dispatch_deleted', { id: dispatchId });
    return true;
  }
  return false;
};


const submitFees = async (id, fees, userId) => {
    const pool = getPool();
    const dispatchId = parseInt(id, 10);
    if(isNaN(dispatchId)) throw new Error('Invalid Dispatch ID');
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const currentRes = await client.query("SELECT * FROM outbound_shipments WHERE id = $1 FOR UPDATE", [dispatchId]);
        if(currentRes.rows.length === 0) throw new Error('Shipment not found for fee submission.');
        const currentShipment = currentRes.rows[0];
        const history = parseHistory(currentShipment.fee_status_history);
        history.push({ status: 'Pending Approval', timestamp: new Date().toISOString(), userId, fromStatus: currentShipment.fee_status });
        
        const query = "UPDATE outbound_shipments SET fees = $1, fee_status = 'Pending Approval', fee_status_history = $2 WHERE id = $3 RETURNING *";
        await client.query(query, [fees, JSON.stringify(history), dispatchId]);

        await notificationService.addSystemAlert({
            severity: 'Info',
            message: `Fees submitted for Shipment #${dispatchId} require approval.`,
            type: 'Fees Submitted for Approval',
            detailsLink: `/dispatch#shipment-${dispatchId}`
        });
        
        await client.query('COMMIT');

        const updatedDispatch = await getDispatchById(dispatchId);
        sendEvent('dispatch_updated', updatedDispatch);
        return updatedDispatch;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const approveFees = async (id, newStatus, userId) => {
    const pool = getPool();
    const dispatchId = parseInt(id, 10);
    if(isNaN(dispatchId)) throw new Error('Invalid Dispatch ID');
    if (newStatus !== 'Approved' && newStatus !== 'Rejected') {
        throw new Error('Invalid fee status provided.');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const currentRes = await client.query("SELECT * FROM outbound_shipments WHERE id = $1 FOR UPDATE", [dispatchId]);
        if(currentRes.rows.length === 0) throw new Error('Shipment not found for fee approval.');
        const currentShipment = currentRes.rows[0];
        const history = parseHistory(currentShipment.fee_status_history);
        history.push({ status: newStatus, timestamp: new Date().toISOString(), userId, fromStatus: currentShipment.fee_status });

        const query = "UPDATE outbound_shipments SET fee_status = $1, fee_status_history = $2 WHERE id = $3 RETURNING *";
        await client.query(query, [newStatus, JSON.stringify(history), dispatchId]);
        
        await client.query('COMMIT');
        
        const updatedDispatch = await getDispatchById(dispatchId);

        if (updatedDispatch.brokerId) {
             await notificationService.addSystemAlert({
                severity: newStatus === 'Approved' ? 'Info' : 'Warning',
                message: `Funds for Shipment #${dispatchId} have been ${newStatus}.`,
                type: 'Funds Approved for Payment',
                detailsLink: `/dispatch#shipment-${dispatchId}`,
                userId: updatedDispatch.brokerId,
            });
        }
        
        sendEvent('dispatch_updated', updatedDispatch);
        return updatedDispatch;
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const confirmPayment = async (id, receipt, userId) => {
    const pool = getPool();
    const dispatchId = parseInt(id, 10);
    if(isNaN(dispatchId)) throw new Error('Invalid Dispatch ID');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const currentDispatchRes = await client.query('SELECT * FROM outbound_shipments WHERE id = $1 FOR UPDATE', [dispatchId]);
        const currentDispatch = currentDispatchRes.rows[0];
        if(!currentDispatch) throw new Error('Shipment not found.');
        if(currentDispatch.fee_status !== 'Approved') throw new Error('Fees must be approved before payment can be confirmed.');
        
        const history = parseHistory(currentDispatch.fee_status_history);
        history.push({ status: 'Payment Confirmed', timestamp: new Date().toISOString(), userId, fromStatus: currentDispatch.fee_status });

        const query = "UPDATE outbound_shipments SET fee_status = 'Payment Confirmed', status = 'In Transit', payment_confirmation_name = $1, payment_confirmation_data = $2, fee_status_history = $3 WHERE id = $4 RETURNING *";
        await client.query(query, [receipt?.name, receipt?.data, JSON.stringify(history), dispatchId]);
        
        await client.query('COMMIT');
        
        const updatedShipment = await getDispatchById(dispatchId);

        await notificationService.addSystemAlert({
            severity: 'Info',
            message: `Shipment #${dispatchId} is now In Transit and en route to its destination.`,
            type: 'Shipment In Transit',
            detailsLink: `/dispatch#shipment-${dispatchId}`,
        });
        
        sendEvent('dispatch_updated', updatedShipment);
        return updatedShipment;
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
  getAllDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  deleteDispatch,
  submitFees,
  approveFees,
  confirmPayment,
};
