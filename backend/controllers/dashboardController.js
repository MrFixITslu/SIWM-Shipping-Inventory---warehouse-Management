// backend/controllers/dashboardController.js
const dashboardServiceBackend = require('../services/dashboardServiceBackend');
const { getSupportDashboardMetrics } = require('./supportController');
const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

const getMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardServiceBackend.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

const getWorkflowMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardServiceBackend.getWorkflowMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

const getShipmentsChart = async (req, res, next) => {
    try {
        const chartData = await dashboardServiceBackend.getShipmentChartData();
        res.json(chartData);
    } catch (error) {
        next(error);
    }
};

const getOrderVolumeChart = async (req, res, next) => {
    try {
        const chartData = await dashboardServiceBackend.getOrderVolumeChartData();
        res.json(chartData);
    } catch (error) {
        next(error);
    }
};

const getUnacknowledgedCount = async (req, res, next) => {
    try {
        const count = await dashboardServiceBackend.getUnacknowledgedOrdersCount();
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

const getItemsBelowReorderPoint = async (req, res, next) => {
    try {
        const items = await dashboardServiceBackend.getItemsBelowReorderPoint();
        res.json({ items });
    } catch (error) {
        next(error);
    }
};

const getItemsAtRiskOfStockOut = async (req, res, next) => {
    try {
        const items = await dashboardServiceBackend.getItemsAtRiskOfStockOut();
        res.json({ items });
    } catch (error) {
        next(error);
    }
};

const getCurrentRunRate = async (req, res, next) => {
    try {
        const runRate = await dashboardServiceBackend.getCurrentRunRate();
        res.json(runRate);
    } catch (error) {
        next(error);
    }
};

const updateRunRate = async (req, res, next) => {
    try {
        const { weeklyInstalls } = req.body;
        if (!weeklyInstalls || weeklyInstalls <= 0) {
            return res.status(400).json({ message: 'Weekly installs must be a positive number' });
        }
        const runRate = await dashboardServiceBackend.updateRunRate(weeklyInstalls);
        res.json(runRate);
    } catch (error) {
        next(error);
    }
};

const getWarehouseMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardServiceBackend.getWarehouseMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

const getInventoryFlow = async (req, res, next) => {
    try {
        const flow = await dashboardServiceBackend.getInventoryFlowData();
        res.json(flow);
    } catch (error) {
        next(error);
    }
};

const getInventoryFlowChart = async (req, res, next) => {
    try {
        const flow = await dashboardServiceBackend.getInventoryFlowChart();
        res.json(flow);
    } catch (error) {
        next(error);
    }
};

const getInventoryMovements = async (req, res) => {
  try {
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
      WHERE im.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY im.created_at DESC
      LIMIT 50
    `);
    const movements = result.rows.map(mapToCamel);
    res.json({ movements });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ message: 'Failed to fetch inventory movements' });
  }
};

const getOfflineStatus = (req, res) => {
  res.json({ status: 'online' });
};

const getStockValueByDepartment = async (req, res, next) => {
    try {
        const stockData = await dashboardServiceBackend.getStockValueByDepartment();
        res.json({ departments: stockData });
    } catch (error) {
        next(error);
    }
};

const getAgedInventory = async (req, res) => {
  try {
    console.log('getAgedInventory called');
    const pool = getPool();
    
    // First, let's test if we can connect to the database
    const testQuery = await pool.query('SELECT 1 as test');
    console.log('Database connection test:', testQuery.rows[0]);
    
    // Check if inventory_items table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inventory_items'
      ) as table_exists
    `);
    
    console.log('Table exists check:', tableCheck.rows[0]);
    
    if (!tableCheck.rows[0].table_exists) {
      res.json({ 
        agedItems: [],
        note: 'inventory_items table does not exist'
      });
      return;
    }

    // Check if required columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' 
      AND column_name IN ('id', 'name', 'sku', 'category', 'quantity', 'cost_price', 'location', 'entry_date', 'last_movement_date', 'is_aged')
    `);
    
    console.log('Available columns:', columnCheck.rows.map(row => row.column_name));
    
    // Build query based on available columns
    let query = `
      SELECT 
        id,
        name,
        sku,
        COALESCE(category, 'Unassigned') as department,
        quantity,
        COALESCE(cost_price, 0) as cost_price,
        (quantity * COALESCE(cost_price, 0)) as total_value,
        location,
        entry_date,
        last_movement_date,
        COALESCE(is_aged, false) as is_aged
    `;

    // Add age calculation if entry_date exists
    if (columnCheck.rows.some(row => row.column_name === 'entry_date')) {
      query += `,
        CASE 
          WHEN entry_date IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - entry_date::timestamp)) / 86400
          ELSE 0
        END as age_in_days
      `;
    } else {
      query += `, 0 as age_in_days`;
    }

    query += `
      FROM inventory_items 
      WHERE quantity > 0
    `;

    // Add aging filter if is_aged column exists
    if (columnCheck.rows.some(row => row.column_name === 'is_aged')) {
      query += `
        AND (
          is_aged = true 
          OR (
            entry_date IS NOT NULL 
            AND entry_date < CURRENT_DATE - INTERVAL '365 days'
          )
        )
      `;
    } else {
      // If is_aged column doesn't exist, only filter by entry_date
      query += `
        AND (
          entry_date IS NOT NULL 
          AND entry_date < CURRENT_DATE - INTERVAL '365 days'
        )
      `;
    }

    query += `
      ORDER BY age_in_days DESC, entry_date ASC
      LIMIT 100
    `;
    
    console.log('Executing query:', query);
    
    const result = await pool.query(query);
    
    console.log('Aged items found in database:', result.rows.length);
    
    if (result.rows.length === 0) {
      res.json({ 
        agedItems: [],
        note: 'No aged inventory items found in database'
      });
      return;
    }
    
    // Process the results
    const agedItems = result.rows.map(row => {
      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        department: row.department,
        quantity: parseInt(row.quantity),
        ageInDays: Math.floor(parseFloat(row.age_in_days) || 0),
        entryDate: row.entry_date,
        lastMovementDate: row.last_movement_date,
        costPrice: parseFloat(row.cost_price || 0),
        totalValue: parseFloat(row.total_value || 0),
        location: row.location,
        isAged: row.is_aged
      };
    });
    
    console.log('Processed aged items:', agedItems.length);
    
    res.json({ agedItems });
  } catch (error) {
    console.error('Error fetching aged inventory:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Fallback: try to get basic inventory data
    try {
      console.log('Attempting fallback method...');
      const pool = getPool();
      const fallbackResult = await pool.query(`
        SELECT 
          id,
          name,
          sku,
          COALESCE(category, 'Unassigned') as department,
          quantity,
          COALESCE(cost_price, 0) as cost_price,
          (quantity * COALESCE(cost_price, 0)) as total_value,
          location,
          entry_date,
          last_movement_date,
          COALESCE(is_aged, false) as is_aged,
          0 as age_in_days
        FROM inventory_items 
        WHERE quantity > 0
        LIMIT 50
      `);
      
      const fallbackItems = fallbackResult.rows.map(row => {
        const entryDate = row.entry_date ? new Date(row.entry_date) : null;
        const now = new Date();
        const ageInDays = entryDate ? Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
          id: row.id,
          name: row.name,
          sku: row.sku,
          department: row.department,
          quantity: parseInt(row.quantity),
          ageInDays: ageInDays,
          entryDate: row.entry_date,
          lastMovementDate: row.last_movement_date,
          costPrice: parseFloat(row.cost_price || 0),
          totalValue: parseFloat(row.total_value || 0),
          location: row.location,
          isAged: row.is_aged
        };
      }).filter(item => item.isAged || item.ageInDays >= 365);
      
      console.log('Fallback method found', fallbackItems.length, 'aged items');
      
      res.json({ 
        agedItems: fallbackItems,
        note: 'Used fallback method due to database query error'
      });
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      res.status(500).json({ 
        message: 'Failed to fetch aged inventory',
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};

// Get Out of Stock Items with Department and Days Out of Stock
const getOutOfStockItemsWithDetails = async (req, res) => {
  try {
    const pool = getPool();
    // Get all items with quantity = 0
    const itemsRes = await pool.query(`
      SELECT id, name, sku, category, department, location
      FROM inventory_items
      WHERE quantity = 0
    `);
    const items = itemsRes.rows;
    if (items.length === 0) {
      return res.json({ items: [] });
    }
    // For each item, find the most recent inventory_movement where quantity became 0
    const itemIds = items.map(item => item.id);
    // Get the last movement for each item where quantity became 0
    const movementsRes = await pool.query(`
      SELECT im.inventory_item_id, im.created_at
      FROM inventory_movements im
      INNER JOIN (
        SELECT inventory_item_id, MAX(created_at) as last_zero_date
        FROM inventory_movements
        WHERE new_quantity = 0
        GROUP BY inventory_item_id
      ) sub ON im.inventory_item_id = sub.inventory_item_id AND im.created_at = sub.last_zero_date
      WHERE im.inventory_item_id = ANY($1)
    `, [itemIds]);
    const movementMap = {};
    for (const row of movementsRes.rows) {
      movementMap[row.inventory_item_id] = row.created_at;
    }
    const now = new Date();
    const result = items.map(item => {
      const zeroDate = movementMap[item.id] ? new Date(movementMap[item.id]) : null;
      let daysOutOfStock = null;
      if (zeroDate) {
        daysOutOfStock = Math.floor((now - zeroDate) / (1000 * 60 * 60 * 24));
      }
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        department: item.department,
        location: item.location,
        daysOutOfStock,
      };
    });
    res.json({ items: result });
  } catch (error) {
    console.error('Error fetching out of stock items with details:', error);
    res.status(500).json({ message: 'Failed to fetch out of stock items with details' });
  }
};

module.exports = {
    getMetrics,
    getWorkflowMetrics,
    getShipmentsChart,
    getOrderVolumeChart,
    getUnacknowledgedCount,
    getWarehouseMetrics,
    getInventoryFlow,
    getInventoryFlowChart,
    getItemsBelowReorderPoint,
    getItemsAtRiskOfStockOut,
    getCurrentRunRate,
    updateRunRate,
    getSupportDashboardMetrics,
    getInventoryMovements,
    getOfflineStatus,
    getStockValueByDepartment,
    getAgedInventory,
    getOutOfStockItemsWithDetails
};