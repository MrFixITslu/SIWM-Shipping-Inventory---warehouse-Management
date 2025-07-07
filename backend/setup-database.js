// backend/setup-database.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const setupDatabase = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully.');

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create_system_settings_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing database setup...');
    await pool.query(sqlContent);
    console.log('Database setup completed successfully.');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 