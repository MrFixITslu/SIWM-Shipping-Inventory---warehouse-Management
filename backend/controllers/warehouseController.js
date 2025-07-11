// backend/controllers/warehouseController.js
const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

// Get all warehouses
const getWarehouses = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        w.*,
        u.name as manager_name,
        COUNT(DISTINCT i.id) as inventory_items_count,
        COUNT(DISTINCT wo.id) as pending_orders_count,
        COUNT(DISTINCT o.id) as active_shipments_count
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      LEFT JOIN inventory_items i ON w.id = i.warehouse_id
      LEFT JOIN warehouse_orders wo ON w.id = wo.warehouse_id AND wo.status IN ('Pending', 'Acknowledged', 'Picking')
      LEFT JOIN outbound_shipments o ON w.id = o.warehouse_id AND o.status IN ('Preparing', 'In Transit')
      GROUP BY w.id, u.name
      ORDER BY w.name
    `);

    const warehouses = result.rows.map(mapToCamel);
    res.json({ warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ message: 'Failed to fetch warehouses' });
  }
};

// Get warehouse by ID
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        w.*,
        u.name as manager_name,
        COUNT(DISTINCT i.id) as inventory_items_count,
        COUNT(DISTINCT wo.id) as pending_orders_count,
        COUNT(DISTINCT o.id) as active_shipments_count
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      LEFT JOIN inventory_items i ON w.id = i.warehouse_id
      LEFT JOIN warehouse_orders wo ON w.id = wo.warehouse_id AND wo.status IN ('Pending', 'Acknowledged', 'Picking')
      LEFT JOIN outbound_shipments o ON w.id = o.warehouse_id AND o.status IN ('Preparing', 'In Transit')
      WHERE w.id = $1
      GROUP BY w.id, u.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    const warehouse = mapToCamel(result.rows[0]);
    res.json({ warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse' });
  }
};

// Create new warehouse
const createWarehouse = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      state,
      country,
      postal_code,
      phone,
      email,
      manager_id,
      capacity_sqft,
      timezone
    } = req.body;

    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO warehouses (
        name, code, address, city, state, country, postal_code, 
        phone, email, manager_id, capacity_sqft, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [name, code, address, city, state, country, postal_code, phone, email, manager_id, capacity_sqft, timezone]);

    const warehouse = mapToCamel(result.rows[0]);
    res.status(201).json({ warehouse });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ message: 'Warehouse code already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create warehouse' });
    }
  }
};

// Update warehouse
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      address,
      city,
      state,
      country,
      postal_code,
      phone,
      email,
      manager_id,
      capacity_sqft,
      status,
      timezone
    } = req.body;

    const pool = getPool();
    const result = await pool.query(`
      UPDATE warehouses SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        country = COALESCE($6, country),
        postal_code = COALESCE($7, postal_code),
        phone = COALESCE($8, phone),
        email = COALESCE($9, email),
        manager_id = COALESCE($10, manager_id),
        capacity_sqft = COALESCE($11, capacity_sqft),
        status = COALESCE($12, status),
        timezone = COALESCE($13, timezone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [name, code, address, city, state, country, postal_code, phone, email, manager_id, capacity_sqft, status, timezone, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    const warehouse = mapToCamel(result.rows[0]);
    res.json({ warehouse });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ message: 'Failed to update warehouse' });
  }
};

// Delete warehouse
const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if warehouse has associated data
    const checkResult = await pool.query(`
      SELECT 
        COUNT(*) as inventory_count,
        COUNT(*) as orders_count,
        COUNT(*) as shipments_count
      FROM (
        SELECT 1 FROM inventory_items WHERE warehouse_id = $1
        UNION ALL
        SELECT 1 FROM warehouse_orders WHERE warehouse_id = $1
        UNION ALL
        SELECT 1 FROM outbound_shipments WHERE warehouse_id = $1
      ) t
    `, [id]);

    if (parseInt(checkResult.rows[0].inventory_count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete warehouse with associated inventory, orders, or shipments' 
      });
    }

    const result = await pool.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ message: 'Failed to delete warehouse' });
  }
};

// Get warehouse zones
const getWarehouseZones = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM warehouse_zones 
      WHERE warehouse_id = $1 
      ORDER BY code
    `, [warehouseId]);

    const zones = result.rows.map(mapToCamel);
    res.json({ zones });
  } catch (error) {
    console.error('Error fetching warehouse zones:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse zones' });
  }
};

// Get warehouse aisles
const getWarehouseAisles = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        wa.*,
        wz.name as zone_name,
        wz.code as zone_code
      FROM warehouse_aisles wa
      JOIN warehouse_zones wz ON wa.zone_id = wz.id
      WHERE wz.warehouse_id = $1
      ORDER BY wa.code
    `, [warehouseId]);

    const aisles = result.rows.map(mapToCamel);
    res.json({ aisles });
  } catch (error) {
    console.error('Error fetching warehouse aisles:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse aisles' });
  }
};

// Get warehouse shelves
const getWarehouseShelves = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        ws.*,
        wa.name as aisle_name,
        wa.code as aisle_code,
        wz.name as zone_name,
        wz.code as zone_code
      FROM warehouse_shelves ws
      JOIN warehouse_aisles wa ON ws.aisle_id = wa.id
      JOIN warehouse_zones wz ON wa.zone_id = wz.id
      WHERE wz.warehouse_id = $1
      ORDER BY ws.code
    `, [warehouseId]);

    const shelves = result.rows.map(mapToCamel);
    res.json({ shelves });
  } catch (error) {
    console.error('Error fetching warehouse shelves:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse shelves' });
  }
};

// Get warehouse capacity data
const getWarehouseCapacity = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { days = 30 } = req.query;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        date,
        total_capacity_cubic_ft,
        used_capacity_cubic_ft,
        available_capacity_cubic_ft,
        capacity_percentage
      FROM warehouse_capacity
      WHERE warehouse_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `, [warehouseId]);

    const capacityData = result.rows.map(mapToCamel);
    res.json({ capacityData });
  } catch (error) {
    console.error('Error fetching warehouse capacity:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse capacity' });
  }
};

// Get warehouse performance data
const getWarehousePerformance = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { days = 30 } = req.query;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        date,
        orders_processed,
        shipments_processed,
        items_received,
        items_shipped,
        average_order_fulfillment_time_hours,
        average_shipment_processing_time_hours
      FROM warehouse_performance
      WHERE warehouse_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `, [warehouseId]);

    const performanceData = result.rows.map(mapToCamel);
    res.json({ performanceData });
  } catch (error) {
    console.error('Error fetching warehouse performance:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse performance' });
  }
};

// Get inventory movements for warehouse
const getInventoryMovements = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { days = 7 } = req.query;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        im.*,
        ii.name as item_name,
        ii.sku as item_sku,
        u.name as performed_by_name
      FROM inventory_movements im
      JOIN inventory_items ii ON im.inventory_item_id = ii.id
      LEFT JOIN users u ON im.performed_by = u.id
      WHERE im.warehouse_id = $1 
        AND im.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY im.created_at DESC
    `, [warehouseId]);

    const movements = result.rows.map(mapToCamel);
    res.json({ movements });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ message: 'Failed to fetch inventory movements' });
  }
};

// Create inventory movement
const createInventoryMovement = async (req, res) => {
  try {
    const {
      inventory_item_id,
      warehouse_id,
      movement_type,
      quantity,
      from_location,
      to_location,
      reference_type,
      reference_id,
      performed_by,
      notes
    } = req.body;

    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO inventory_movements (
        inventory_item_id, warehouse_id, movement_type, quantity,
        from_location, to_location, reference_type, reference_id,
        performed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [inventory_item_id, warehouse_id, movement_type, quantity, from_location, to_location, reference_type, reference_id, performed_by, notes]);

    const movement = mapToCamel(result.rows[0]);
    res.status(201).json({ movement });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    res.status(500).json({ message: 'Failed to create inventory movement' });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseZones,
  getWarehouseAisles,
  getWarehouseShelves,
  getWarehouseCapacity,
  getWarehousePerformance,
  getInventoryMovements,
  createInventoryMovement
}; 