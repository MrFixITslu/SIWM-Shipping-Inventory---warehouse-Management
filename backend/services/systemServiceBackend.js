
const { getPool } = require('../config/db');

const resetTransactionalData = async () => {
  const pool = getPool();
  const client = await pool.connect();
  
  // The order is important to avoid foreign key constraint violations if not using CASCADE broadly.
  // TRUNCATE is faster than DELETE and also resets identity columns (SERIAL).
  // RESTART IDENTITY resets the sequence generators.
  // CASCADE will automatically truncate all tables that have foreign-key references.
  const tablesToTruncate = [
    'warehouse_orders',
    'asns',
    'inventory_items',
    'maintenance_records',
    'alert_log',
    'user_audit_log',
    'ai_feedback'
  ];

  try {
    await client.query('BEGIN');
    console.log('[SYSTEM RESET] Starting data truncation...');

    // This query will truncate the listed tables and, due to CASCADE, will also
    // truncate other tables that have foreign keys to them, such as:
    // - outbound_shipments (references warehouse_orders)
    // - warehouse_order_items (references warehouse_orders, inventory_items)
    // - asn_items (references asns, inventory_items)
    // This is an efficient way to wipe all related transactional data.
    const truncateQuery = `TRUNCATE TABLE ${tablesToTruncate.join(', ')} RESTART IDENTITY CASCADE;`;
    
    await client.query(truncateQuery);
    
    await client.query('COMMIT');
    console.log('[SYSTEM RESET] Successfully truncated all transactional data tables.');
    return { success: true, message: 'All transactional data has been reset successfully.' };
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[SYSTEM RESET] Error during data truncation, rolling back transaction.', e);
    throw new Error('Failed to reset system data due to a database error.');
  } finally {
    client.release();
  }
};

module.exports = { resetTransactionalData };
