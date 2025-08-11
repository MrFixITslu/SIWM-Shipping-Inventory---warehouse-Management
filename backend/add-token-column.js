const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addTokenColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding token_invalidated_at column to users table...');
    
    // Check if the column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'token_invalidated_at'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Column token_invalidated_at already exists in users table.');
      return;
    }
    
    // Add the column
    await client.query(`
      ALTER TABLE users ADD COLUMN token_invalidated_at TIMESTAMP
    `);
    
    console.log('Successfully added token_invalidated_at column to users table.');
    
    // Log the migration
    try {
      await client.query(`
        INSERT INTO audit_logs (user_id, action, details, created_at)
        VALUES (1, 'SYSTEM_MIGRATION', 'Added token_invalidated_at column to users table', CURRENT_TIMESTAMP)
      `);
      console.log('Migration logged to audit_logs.');
    } catch (logError) {
      console.log('Note: Could not log to audit_logs (table might not exist):', logError.message);
    }
    
  } catch (error) {
    console.error('Error adding token_invalidated_at column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addTokenColumn()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addTokenColumn }; 