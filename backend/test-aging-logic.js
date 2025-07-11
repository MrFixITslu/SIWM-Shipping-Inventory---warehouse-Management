// backend/test-aging-logic.js
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testAgingLogic = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Testing automatic aging logic...');
    
    // Create a test item with an old entry date (2 years ago)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const oldEntryDate = twoYearsAgo.toISOString().split('T')[0];
    
    console.log(`Creating test item with entry date: ${oldEntryDate}`);
    
    const result = await pool.query(`
      INSERT INTO inventory_items (
        sku, name, category, quantity, location, 
        reorder_point, is_serialized, cost_price, 
        entry_date, last_movement_date, is_aged
      ) VALUES (
        'TEST-AGED-001', 'Test Aged Item', 'Test Category', 
        10, 'Test Location', 5, false, 10.00, 
        $1, $1, false
      ) RETURNING *
    `, [oldEntryDate]);
    
    const testItem = result.rows[0];
    console.log('✅ Created test item:', {
      id: testItem.id,
      name: testItem.name,
      entryDate: testItem.entry_date,
      isAged: testItem.is_aged
    });
    
    // Now test the automatic aging logic
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const itemDate = new Date(testItem.entry_date);
    
    console.log(`\n📅 Date comparison:`);
    console.log(`- Item entry date: ${itemDate.toISOString().split('T')[0]}`);
    console.log(`- One year ago: ${oneYearAgo.toISOString().split('T')[0]}`);
    console.log(`- Is item older than 365 days? ${itemDate < oneYearAgo ? 'YES' : 'NO'}`);
    
    // Update the item to trigger automatic aging
    const updateResult = await pool.query(`
      UPDATE inventory_items 
      SET is_aged = CASE 
        WHEN entry_date < CURRENT_DATE - INTERVAL '365 days' THEN TRUE 
        ELSE is_aged 
      END
      WHERE id = $1
      RETURNING *
    `, [testItem.id]);
    
    const updatedItem = updateResult.rows[0];
    console.log(`\n✅ After automatic aging logic:`);
    console.log(`- Item ID: ${updatedItem.id}`);
    console.log(`- Name: ${updatedItem.name}`);
    console.log(`- Entry Date: ${updatedItem.entry_date}`);
    console.log(`- Is Aged: ${updatedItem.is_aged}`);
    
    // Clean up - delete the test item
    await pool.query('DELETE FROM inventory_items WHERE id = $1', [testItem.id]);
    console.log('\n🧹 Cleaned up test item');
    
  } catch (error) {
    console.error('❌ Error testing aging logic:', error.message);
  } finally {
    await pool.end();
  }
};

testAgingLogic(); 