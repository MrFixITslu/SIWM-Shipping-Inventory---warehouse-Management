// backend/setup-multi-warehouse.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const setupMultiWarehouse = async () => {
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

    // Read and execute the multi-warehouse SQL file
    const sqlPath = path.join(__dirname, 'create_multi_warehouse_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing multi-warehouse database setup...');
    await pool.query(sqlContent);
    console.log('Multi-warehouse database setup completed successfully.');
    
    // Insert sample data for testing
    console.log('Inserting sample warehouse data...');
    await insertSampleData(pool);
    console.log('Sample data inserted successfully.');
    
  } catch (error) {
    console.error('Error setting up multi-warehouse database:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

const insertSampleData = async (pool) => {
  // Insert additional warehouses
  const warehouses = [
    {
      name: 'West Coast Distribution Center',
      code: 'WH002',
      address: '456 Pacific Blvd',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      postal_code: '90210',
      phone: '555-987-6543',
      email: 'westcoast@company.com'
    },
    {
      name: 'East Coast Hub',
      code: 'WH003',
      address: '789 Atlantic Ave',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10001',
      phone: '555-456-7890',
      email: 'eastcoast@company.com'
    }
  ];

  for (const warehouse of warehouses) {
    await pool.query(`
      INSERT INTO warehouses (name, code, address, city, state, country, postal_code, phone, email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (code) DO NOTHING
    `, [warehouse.name, warehouse.code, warehouse.address, warehouse.city, warehouse.state, warehouse.country, warehouse.postal_code, warehouse.phone, warehouse.email]);
  }

  // Insert sample support tickets
  const tickets = [
    {
      ticket_number: 'TKT-2024-003',
      title: 'Equipment malfunction in Zone A',
      description: 'Forklift #FL-001 showing error codes and needs maintenance',
      category: 'technical',
      priority: 'high',
      status: 'open',
      created_by: 1,
      warehouse_id: 1
    },
    {
      ticket_number: 'TKT-2024-004',
      title: 'Inventory count discrepancy',
      description: 'Physical count shows 15 units but system shows 18 for SKU ABC123',
      category: 'inventory',
      priority: 'medium',
      status: 'in_progress',
      created_by: 1,
      warehouse_id: 2
    }
  ];

  for (const ticket of tickets) {
    await pool.query(`
      INSERT INTO support_tickets (ticket_number, title, description, category, priority, status, created_by, warehouse_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (ticket_number) DO NOTHING
    `, [ticket.ticket_number, ticket.title, ticket.description, ticket.category, ticket.priority, ticket.status, ticket.created_by, ticket.warehouse_id]);
  }

  // Insert sample inventory movements
  const movements = [
    {
      inventory_item_id: 1,
      warehouse_id: 1,
      movement_type: 'received',
      quantity: 50,
      from_location: 'Loading Dock',
      to_location: 'A1-S1',
      reference_type: 'asn',
      reference_id: 1,
      performed_by: 1,
      notes: 'Initial stock received'
    },
    {
      inventory_item_id: 1,
      warehouse_id: 1,
      movement_type: 'shipped',
      quantity: 10,
      from_location: 'A1-S1',
      to_location: 'Shipping Dock',
      reference_type: 'order',
      reference_id: 1,
      performed_by: 2,
      notes: 'Order fulfillment'
    }
  ];

  for (const movement of movements) {
    await pool.query(`
      INSERT INTO inventory_movements (inventory_item_id, warehouse_id, movement_type, quantity, from_location, to_location, reference_type, reference_id, performed_by, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [movement.inventory_item_id, movement.warehouse_id, movement.movement_type, movement.quantity, movement.from_location, movement.to_location, movement.reference_type, movement.reference_id, movement.performed_by, movement.notes]);
  }
};

// Run if called directly
if (require.main === module) {
  setupMultiWarehouse()
    .then(() => {
      console.log('Multi-warehouse setup completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Multi-warehouse setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupMultiWarehouse }; 