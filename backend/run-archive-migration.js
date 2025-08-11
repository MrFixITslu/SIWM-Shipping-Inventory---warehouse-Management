const { getPool, connectDB } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runArchiveMigration() {
  try {
    console.log('Starting notification archiving migration...');
    
    // Connect to database
    await connectDB();
    const pool = getPool();
    
    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'add_archived_column.sql'), 'utf8');
    
    console.log('Executing migration SQL...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('Added is_archived and created_at columns to alert_log table');
    console.log('Created indexes for better performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runArchiveMigration(); 