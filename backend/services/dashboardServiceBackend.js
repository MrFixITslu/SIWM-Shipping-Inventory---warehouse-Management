// backend/services/dashboardServiceBackend.js
const { getPool } = require('../config/db');

const getDashboardMetrics = async () => {
  const pool = getPool();
  
  try {
    // Get basic metrics
    const [
      activeShipmentsResult,
      inventoryItemsResult,
      pendingOrdersResult,
      dispatchesTodayResult,
      activeVendorsResult,
      stockAlertsResult
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM asns WHERE status IN ('pending', 'in_transit')"),
      pool.query("SELECT COUNT(*) as count FROM inventory_items WHERE quantity > 0"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) as count FROM dispatch_logs WHERE DATE(created_at) = CURRENT_DATE"),
      pool.query("SELECT COUNT(*) as count FROM vendors WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= reorder_point AND quantity >= 0")
    ]);

    return {
      activeShipments: parseInt(activeShipmentsResult.rows[0].count),
      inventoryItems: parseInt(inventoryItemsResult.rows[0].count),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count),
      dispatchesToday: parseInt(dispatchesTodayResult.rows[0].count),
      activeVendors: parseInt(activeVendorsResult.rows[0].count),
      stockAlerts: parseInt(stockAlertsResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      activeShipments: 0,
      inventoryItems: 0,
      pendingOrders: 0,
      dispatchesToday: 0,
      activeVendors: 0,
      stockAlerts: 0
    };
  }
};

const getWorkflowMetrics = async () => {
  const pool = getPool();
  
  try {
    const [
      ordersAcknowledgedResult,
      ordersPickedResult,
      ordersPackedResult,
      ordersShippedResult
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'acknowledged'"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'picking'"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'packed'"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'")
    ]);

    return {
      ordersAcknowledged: ordersAcknowledgedResult.rows[0].count,
      ordersPicked: ordersPickedResult.rows[0].count,
      ordersPacked: ordersPackedResult.rows[0].count,
      ordersShipped: ordersShippedResult.rows[0].count
    };
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    return {
      ordersAcknowledged: '0',
      ordersPicked: '0',
      ordersPacked: '0',
      ordersShipped: '0'
    };
  }
};

const getShipmentChartData = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM asns 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    return result.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Error fetching shipment chart data:', error);
    return [];
  }
};

const getOrderVolumeChartData = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    return result.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Error fetching order volume chart data:', error);
    return [];
  }
};

const getUnacknowledgedOrdersCount = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error fetching unacknowledged orders count:', error);
    return 0;
  }
};

const getItemsBelowReorderPoint = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        sku,
        quantity,
        reorder_point,
        location,
        category
      FROM inventory_items 
      WHERE quantity <= reorder_point AND quantity >= 0
      ORDER BY quantity ASC
      LIMIT 50
    `);
    
    return result.rows.map(row => ({
      itemId: row.id,
      itemName: row.name,
      sku: row.sku,
      currentQuantity: parseInt(row.quantity),
      reorderPoint: parseInt(row.reorder_point),
      shortfall: parseInt(row.reorder_point) - parseInt(row.quantity),
      category: row.category,
      location: row.location
    }));
  } catch (error) {
    console.error('Error fetching items below reorder point:', error);
    return [];
  }
};

const getItemsAtRiskOfStockOut = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        sku,
        quantity,
        location
      FROM inventory_items 
      WHERE quantity <= 5 AND quantity > 0
      ORDER BY quantity ASC
      LIMIT 50
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      quantity: parseInt(row.quantity),
      location: row.location
    }));
  } catch (error) {
    console.error('Error fetching items at risk of stock out:', error);
    return [];
  }
};

const getCurrentRunRate = async () => {
  // Default run rate - in a real system this would come from a settings table
  return {
    weeklyInstalls: 66,
    lastUpdated: new Date().toISOString(),
    source: 'default'
  };
};

const updateRunRate = async (weeklyInstalls) => {
  // In a real system, this would update a settings table
  return {
    weeklyInstalls,
    lastUpdated: new Date().toISOString(),
    source: 'manual'
  };
};

const getWarehouseMetrics = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        location,
        capacity,
        current_utilization
      FROM warehouses
      ORDER BY name
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      capacity: parseInt(row.capacity || 0),
      currentUtilization: parseInt(row.current_utilization || 0)
    }));
  } catch (error) {
    console.error('Error fetching warehouse metrics:', error);
    return [];
  }
};

const getInventoryFlowData = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        'incoming' as type,
        COUNT(*) as count
      FROM asns 
      WHERE status = 'pending'
      UNION ALL
      SELECT 
        'outgoing' as type,
        COUNT(*) as count
      FROM orders 
      WHERE status = 'shipped'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    return result.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Error fetching inventory flow data:', error);
    return [];
  }
};

const getInventoryFlowChart = async () => {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inventory_movements 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    return result.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Error fetching inventory flow chart:', error);
    return [];
  }
};

const getStockValueByDepartment = async () => {
  const pool = getPool();
  
  try {
    // First, ensure the department column exists
    await pool.query('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS department VARCHAR(255)');
    
    // Query to get stock value by department using the department field
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
    
    return result.rows.map(row => ({
      department: row.department,
      itemCount: parseInt(row.item_count),
      totalQuantity: parseInt(row.total_quantity),
      totalValue: parseFloat(row.total_value || 0)
    }));
  } catch (error) {
    console.error('Error fetching stock value by department:', error);
    throw error;
  }
};

// Export all functions
module.exports = {
  getDashboardMetrics,
  getWorkflowMetrics,
  getShipmentChartData,
  getOrderVolumeChartData,
  getUnacknowledgedOrdersCount,
  getItemsBelowReorderPoint,
  getItemsAtRiskOfStockOut,
  getCurrentRunRate,
  updateRunRate,
  getWarehouseMetrics,
  getInventoryFlowData,
  getInventoryFlowChart,
  getStockValueByDepartment
};