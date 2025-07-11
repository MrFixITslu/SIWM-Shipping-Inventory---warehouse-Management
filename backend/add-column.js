// backend/add-column.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const addSafetyStockColumn = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vision79_inventory',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Read and execute the SQL script
    const sqlPath = path.join(__dirname, 'add-safety-stock-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Adding safety_stock column...');
    await pool.query(sql);
    console.log('✅ safety_stock column added successfully');

    // Verify the column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'safety_stock'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ safety_stock column verified');
    } else {
      console.log('❌ safety_stock column not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
};

addSafetyStockColumn(); 