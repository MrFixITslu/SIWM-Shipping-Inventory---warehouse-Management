// backend/test-db.js
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testDatabase = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Testing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PORT:', process.env.DB_PORT);
    
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Test if tables exist
    const tables = [
      'warehouses',
      'inventory_items', 
      'warehouse_orders',
      'outbound_shipments',
      'vendors',
      'support_tickets',
      'inventory_movements',
      'system_settings'
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}' exists with ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ Table '${table}' does not exist: ${error.message}`);
      }
    }

    // Test a simple query
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM warehouses');
      console.log(`✅ Warehouses table has ${result.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ Error querying warehouses: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
};

testDatabase(); 