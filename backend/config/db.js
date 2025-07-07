
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

const connectDB = async () => {
  try {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    await pool.query('SELECT NOW()');
    console.log('PostgreSQL Connected successfully.');

    // The initializeDatabaseSchema function has been removed.
    // Schema is now managed by a dedicated migration system.
    // See README.md for details on running migrations.

  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB first.');
  }
  return pool;
};

module.exports = { connectDB, getPool };