

// backend/services/vendorService.js
const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const { sendEvent } = require('./sseService');

// This function now takes snake_case DB data and returns a fully mapped camelCase app object
const mapDbVendorToAppVendor = (dbVendor) => {
    if (!dbVendor) return null;
    const appVendor = mapToCamel(dbVendor);
    if(appVendor.lastCommunicationDate) {
        appVendor.lastCommunicationDate = new Date(appVendor.lastCommunicationDate).toISOString().split('T')[0];
    }
    if(!appVendor.products) appVendor.products = [];
    return appVendor;
};

const getAllVendors = async () => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM vendors ORDER BY name ASC');
  return res.rows.map(mapDbVendorToAppVendor);
};

const getVendorById = async (id) => {
  const pool = getPool();
  const vendorId = parseInt(id, 10);
  if (isNaN(vendorId)) throw new Error('Invalid Vendor ID format');
  const res = await pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
  return mapDbVendorToAppVendor(res.rows[0]);
};

const createVendor = async (vendorData) => { // Expects camelCase
  const pool = getPool();
  const dbData = mapToSnake(vendorData);
  const { name, contact_person, email, phone, performance_score = 0, last_communication_date, products = [], lead_time_days, total_spend } = dbData;
  const res = await pool.query(
    'INSERT INTO vendors (name, contact_person, email, phone, performance_score, last_communication_date, products, lead_time_days, total_spend) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [name, contact_person, email, phone, performance_score, last_communication_date, products, lead_time_days || 14, total_spend]
  );
  const newVendor = mapDbVendorToAppVendor(res.rows[0]);
  sendEvent('vendor_created', newVendor);
  return newVendor;
};

const updateVendor = async (id, updatedData) => { // Expects camelCase
  const pool = getPool();
  const vendorId = parseInt(id, 10);
  if (isNaN(vendorId)) throw new Error('Invalid Vendor ID format');

  const dbData = mapToSnake(updatedData);
  const fields = Object.keys(dbData).filter(k => k !== 'id').map((key, i) => `${key} = $${i + 1}`);
  const values = Object.keys(dbData).filter(k => k !== 'id').map(key => dbData[key]);
  
  if (fields.length === 0) return getVendorById(vendorId);

  values.push(vendorId);
  const queryText = `UPDATE vendors SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
  
  const res = await pool.query(queryText, values);
  const updatedVendor = mapDbVendorToAppVendor(res.rows[0]);
  sendEvent('vendor_updated', updatedVendor);
  return updatedVendor;
};

const deleteVendor = async (id) => {
  const pool = getPool();
  const vendorId = parseInt(id, 10);
  if (isNaN(vendorId)) throw new Error('Invalid Vendor ID format');
  const res = await pool.query('DELETE FROM vendors WHERE id = $1 RETURNING id', [vendorId]);
  if (res.rowCount > 0) {
    sendEvent('vendor_deleted', { id: vendorId });
    return true;
  }
  return false;
};

module.exports = { getAllVendors, getVendorById, createVendor, updateVendor, deleteVendor };