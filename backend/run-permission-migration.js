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

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting permission migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'update_user_permissions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        try {
          await client.query(statement);
        } catch (error) {
          if (error.message.includes('audit_logs') && error.message.includes('does not exist')) {
            console.log('Skipping audit_logs insert (table does not exist)');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('Permission migration completed successfully!');
    
    // Show summary of updated users
    const result = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE permissions IS NOT NULL AND permissions != '{}'
      GROUP BY role
      ORDER BY role
    `);
    
    console.log('\nUpdated users by role:');
    result.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count} users`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration }; 