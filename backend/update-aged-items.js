// backend/update-aged-items.js
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const updateAgedItems = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Updating aged items...');
    
    // Update items that are older than 365 days to be marked as aged
    const result = await pool.query(`
      UPDATE inventory_items 
      SET is_aged = TRUE 
      WHERE entry_date < CURRENT_DATE - INTERVAL '365 days'
      AND (is_aged IS NULL OR is_aged = FALSE)
      RETURNING id, name, entry_date, is_aged
    `);
    
    console.log(`✅ Updated ${result.rows.length} items to be marked as aged.`);
    
    if (result.rows.length > 0) {
      console.log('Updated items:');
      result.rows.forEach(row => {
        console.log(`- ${row.name} (ID: ${row.id}, Entry Date: ${row.entry_date})`);
      });
    }
    
    // Show summary of all aged items
    const agedItemsResult = await pool.query(`
      SELECT id, name, entry_date, is_aged 
      FROM inventory_items 
      WHERE is_aged = TRUE 
      ORDER BY entry_date ASC
    `);
    
    console.log(`\n📊 Total aged items in database: ${agedItemsResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error updating aged items:', error.message);
  } finally {
    await pool.end();
  }
};

updateAgedItems(); 