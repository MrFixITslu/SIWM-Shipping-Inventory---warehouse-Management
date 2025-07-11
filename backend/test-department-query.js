const { getPool, connectDB } = require('./config/db');

async function testDepartmentQuery() {
  // Initialize database connection
  await connectDB();
  const pool = getPool();
  
  try {
    console.log('Testing department field in inventory_items...');
    
    // First, ensure the department column exists
    await pool.query('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS department VARCHAR(255)');
    console.log('✅ Department column check completed');
    
    // Test query to get stock value by department
    const query = `
      SELECT 
        COALESCE(department, 'Unassigned') as department,
        COUNT(*) as item_count,
        SUM(quantity) as total_quantity,
        SUM(quantity * COALESCE(cost_price, 0)) as total_value
      FROM inventory_items 
      WHERE quantity > 0
      GROUP BY department
      ORDER BY total_value DESC
    `;
    
    const result = await pool.query(query);
    console.log('✅ Query executed successfully');
    console.log('Results:', result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error testing department query:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testDepartmentQuery()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 