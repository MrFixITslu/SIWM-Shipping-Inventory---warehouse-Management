const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testReorderPoint = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Testing items below reorder point query...');
    
    // Test the exact query from the dashboard service
    const result = await pool.query(`
      SELECT 
        id,
        name,
        sku,
        quantity,
        reorder_point,
        location,
        category
      FROM inventory_items 
      WHERE quantity <= reorder_point AND quantity >= 0
      ORDER BY quantity ASC
      LIMIT 50
    `);
    
    console.log(`✅ Query executed successfully. Found ${result.rows.length} items below reorder point.`);
    
    if (result.rows.length > 0) {
      console.log('Sample items below reorder point:');
      result.rows.slice(0, 5).forEach((item, index) => {
        const shortfall = item.reorder_point - item.quantity;
        console.log(`${index + 1}. ${item.name} (SKU: ${item.sku})`);
        console.log(`   Current Qty: ${item.quantity}, Reorder Point: ${item.reorder_point}, Shortfall: ${shortfall}`);
        console.log(`   Location: ${item.location}, Category: ${item.category}`);
        console.log('');
      });
    } else {
      console.log('No items are currently below their reorder point.');
    }
    
    // Test the dashboard metrics query
    const metricsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inventory_items 
      WHERE quantity <= reorder_point AND quantity >= 0
    `);
    
    console.log(`📊 Dashboard metric - Stock Alerts: ${metricsResult.rows[0].count} items below reorder point`);
    
  } catch (error) {
    console.error('❌ Error testing reorder point query:', error.message);
  } finally {
    await pool.end();
  }
};

testReorderPoint(); 