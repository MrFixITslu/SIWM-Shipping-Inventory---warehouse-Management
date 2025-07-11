const { getPool } = require('./config/db');

async function addDepartmentColumn() {
  const pool = getPool();
  
  try {
    console.log('Adding department column to inventory_items table...');
    
    // Check if column exists
    const checkQuery = `
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'department'
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      // Column doesn't exist, add it
      const addColumnQuery = `
        ALTER TABLE inventory_items 
        ADD COLUMN department VARCHAR(255)
      `;
      
      await pool.query(addColumnQuery);
      
      // Add comment
      const commentQuery = `
        COMMENT ON COLUMN inventory_items.department IS 'Department or category for inventory item organization'
      `;
      
      await pool.query(commentQuery);
      
      console.log('✅ Department column added successfully!');
    } else {
      console.log('✅ Department column already exists!');
    }
    
  } catch (error) {
    console.error('❌ Error adding department column:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
addDepartmentColumn()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 