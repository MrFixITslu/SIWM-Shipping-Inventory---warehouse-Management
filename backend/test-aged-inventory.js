build// backend/test-aged-inventory.js
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testAgedInventory = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Testing aged inventory query...');
    
    // Test the exact query from the controller
    const result = await pool.query(`
      SELECT 
        id,
        name,
        sku,
        COALESCE(category, 'Unassigned') as department,
        quantity,
        cost_price,
        (quantity * COALESCE(cost_price, 0)) as total_value,
        location,
        entry_date,
        last_movement_date,
        is_aged
      FROM inventory_items 
      WHERE quantity > 0
      ORDER BY entry_date ASC
      LIMIT 100
    `);
    
    console.log(`✅ Query executed successfully. Found ${result.rows.length} items.`);
    
    if (result.rows.length > 0) {
      console.log('Sample item:', result.rows[0]);
      
      // Test the aging logic
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      const agedItems = result.rows
        .filter(row => {
          if (!row.entry_date) return false;
          const itemDate = new Date(row.entry_date);
          return itemDate < oneYearAgo || row.is_aged === true;
        })
        .map(row => {
          const itemDate = new Date(row.entry_date);
          const ageInDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
          
          return {
            id: row.id,
            name: row.name,
            sku: row.sku,
            department: row.department,
            quantity: parseInt(row.quantity),
            ageInDays: ageInDays,
            entryDate: row.entry_date,
            lastMovementDate: row.last_movement_date,
            costPrice: parseFloat(row.cost_price || 0),
            totalValue: parseFloat(row.total_value || 0),
            location: row.location,
            isAged: row.is_aged || false
          };
        })
        .sort((a, b) => b.ageInDays - a.ageInDays)
        .slice(0, 50);
      
      console.log(`✅ Found ${agedItems.length} aged items (older than 365 days or manually marked).`);
      if (agedItems.length > 0) {
        console.log('Oldest item:', agedItems[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing aged inventory:', error.message);
  } finally {
    await pool.end();
  }
};

testAgedInventory(); 