// backend/services/assetService.js
const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const { sendEvent } = require('./sseService');

const getAllAssets = async () => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM assets ORDER BY name ASC');
  return mapToCamel(res.rows);
};

const getAssetById = async (id) => {
  const pool = getPool();
  const assetId = parseInt(id, 10);
  if (isNaN(assetId)) throw new Error('Invalid asset ID format');
  const res = await pool.query('SELECT * FROM assets WHERE id = $1', [assetId]);
  return mapToCamel(res.rows[0]);
};

const createAsset = async (assetData) => { // Expects camelCase
  const pool = getPool();
  const dbData = mapToSnake(assetData);
  const { name, asset_type, serial_number, location, status, purchase_date, purchase_cost, last_maintenance_date, next_scheduled_maintenance, notes, image_url } = dbData;
  const res = await pool.query(
    'INSERT INTO assets (name, asset_type, serial_number, location, status, purchase_date, purchase_cost, last_maintenance_date, next_scheduled_maintenance, notes, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    [name, asset_type, serial_number, location, status, purchase_date, purchase_cost, last_maintenance_date, next_scheduled_maintenance, notes, image_url]
  );
  const newAsset = mapToCamel(res.rows[0]);
  sendEvent('asset_created', newAsset);
  return newAsset;
};

const updateAsset = async (id, updatedData) => { // Expects camelCase
  const pool = getPool();
  const assetId = parseInt(id, 10);
  if (isNaN(assetId)) throw new Error('Invalid asset ID format');

  const dbData = mapToSnake(updatedData);
  const fields = [];
  const values = [];
  let paramCount = 1;
  for (const key in dbData) {
    if (Object.prototype.hasOwnProperty.call(dbData, key) && key !== 'id') {
      fields.push(`${key} = $${paramCount++}`);
      values.push(dbData[key]);
    }
  }
  if (fields.length === 0) throw new Error("No fields to update for asset.");

  values.push(assetId);
  const queryText = `UPDATE assets SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const res = await pool.query(queryText, values);
  const updatedAsset = mapToCamel(res.rows[0]);
  sendEvent('asset_updated', updatedAsset);
  return updatedAsset;
};

const deleteAsset = async (id) => {
  const pool = getPool();
  const assetId = parseInt(id, 10);
  if (isNaN(assetId)) throw new Error('Invalid asset ID format');
  const res = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING id', [assetId]);
  if (res.rowCount > 0) {
    sendEvent('asset_deleted', { id: assetId });
    return true;
  }
  return false;
};

// Maintenance Records
const getMaintenanceRecordsByAssetId = async (assetIdParam) => {
  const pool = getPool();
  const assetId = parseInt(assetIdParam, 10);
  if (isNaN(assetId)) throw new Error('Invalid asset ID for maintenance records');
  const res = await pool.query('SELECT * FROM maintenance_records WHERE asset_id = $1 ORDER BY date DESC', [assetId]);
  return mapToCamel(res.rows);
};

const addMaintenanceRecord = async (assetId, recordData) => { // Expects camelCase
  const pool = getPool();
  const client = await pool.connect();
  const assetIdNum = parseInt(assetId, 10);
  if (isNaN(assetIdNum)) throw new Error('Invalid asset ID format');

  try {
    await client.query('BEGIN');
    const dbData = mapToSnake(recordData);
    const { date, type, description, performed_by, cost, downtime_hours } = dbData;
    
    const res = await client.query(
      'INSERT INTO maintenance_records (asset_id, date, type, description, performed_by, cost, downtime_hours) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [assetIdNum, date, type, description, performed_by, cost, downtime_hours]
    );
    const newRecord = mapToCamel(res.rows[0]);

    // Now update the parent asset's last maintenance date
    const assetUpdateRes = await client.query(
      'UPDATE assets SET last_maintenance_date = $1 WHERE id = $2 RETURNING *',
      [date, assetIdNum]
    );
    
    await client.query('COMMIT');
    
    // Send SSE event for the updated asset to trigger UI refresh
    const updatedAsset = mapToCamel(assetUpdateRes.rows[0]);
    sendEvent('asset_updated', updatedAsset);
    
    return newRecord;
  } catch(e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const updateMaintenanceRecord = async (id, updatedData) => { // Expects camelCase
  const pool = getPool();
  const client = await pool.connect();
  const recordId = parseInt(id, 10);
  if (isNaN(recordId)) throw new Error('Invalid maintenance record ID format');

  try {
      await client.query('BEGIN');
      const dbData = mapToSnake(updatedData);
      const fields = [];
      const values = [];
      let paramCount = 1;
      for (const key in dbData) {
        if (Object.prototype.hasOwnProperty.call(dbData, key) && key !== 'id' && key !== 'asset_id') {
          fields.push(`${key} = $${paramCount++}`);
          values.push(dbData[key]);
        }
      }
      if (fields.length === 0) throw new Error("No fields to update for maintenance record.");

      values.push(recordId);
      const queryText = `UPDATE maintenance_records SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      
      const res = await client.query(queryText, values);
      const updatedRecord = mapToCamel(res.rows[0]);

      if (!updatedRecord) {
        throw new Error('Maintenance record not found for update.');
      }

      // After updating, find the latest maintenance date for the asset and update it
      const latestMaintRes = await client.query(
          'SELECT MAX(date) as last_date FROM maintenance_records WHERE asset_id = $1',
          [updatedRecord.assetId]
      );
      const lastMaintenanceDate = latestMaintRes.rows[0].last_date;

      const assetUpdateRes = await client.query(
          'UPDATE assets SET last_maintenance_date = $1 WHERE id = $2 RETURNING *',
          [lastMaintenanceDate, updatedRecord.assetId]
      );
      
      await client.query('COMMIT');

      const updatedAsset = mapToCamel(assetUpdateRes.rows[0]);
      sendEvent('asset_updated', updatedAsset);

      return updatedRecord;
  } catch (e) {
      await client.query('ROLLBACK');
      throw e;
  } finally {
      client.release();
  }
};

const deleteMaintenanceRecord = async (id) => {
  const pool = getPool();
  const recordId = parseInt(id, 10);
  if (isNaN(recordId)) throw new Error('Invalid maintenance record ID format');
  const res = await pool.query('DELETE FROM maintenance_records WHERE id = $1 RETURNING id', [recordId]);
  return res.rowCount > 0;
};

module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getMaintenanceRecordsByAssetId,
  addMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
};