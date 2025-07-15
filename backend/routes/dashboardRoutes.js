// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getMetrics, getShipmentsChart, getOrderVolumeChart, getUnacknowledgedCount, getWorkflowMetrics, getItemsBelowReorderPoint, getItemsAtRiskOfStockOut, getCurrentRunRate, updateRunRate, getWarehouseMetrics, getInventoryFlow, getSupportDashboardMetrics, getOfflineStatus, getInventoryMovements, getInventoryFlowChart, getStockValueByDepartment, getAgedInventory, getOutOfStockItemsWithDetails } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/metrics', getMetrics);
router.get('/workflow-metrics', getWorkflowMetrics);
router.get('/charts/shipments', getShipmentsChart);
router.get('/charts/order-volume', getOrderVolumeChart);
router.get('/unacknowledged-orders-count', getUnacknowledgedCount);
router.get('/warehouse-metrics', getWarehouseMetrics);
router.get('/inventory-flow', getInventoryFlow);
router.get('/inventory-movements', getInventoryMovements);
router.get('/inventory-flow-chart', getInventoryFlowChart);
router.get('/support-metrics', getSupportDashboardMetrics);
router.get('/offline-status', getOfflineStatus);

// New stock analysis routes
router.get('/items-below-reorder-point', getItemsBelowReorderPoint);
router.get('/items-at-risk', getItemsAtRiskOfStockOut);
router.get('/out-of-stock-items', getOutOfStockItemsWithDetails);
router.get('/run-rate', getCurrentRunRate);
router.post('/update-run-rate', updateRunRate);

// New dashboard endpoints
router.get('/stock-value-by-department', getStockValueByDepartment);
router.get('/aged-inventory', getAgedInventory);

module.exports = router;