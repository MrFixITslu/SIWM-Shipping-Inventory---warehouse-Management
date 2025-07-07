// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getMetrics, getShipmentsChart, getOrderVolumeChart, getUnacknowledgedCount, getWorkflowMetrics, getItemsBelowReorderPoint, getItemsAtRiskOfStockOut, getCurrentRunRate, updateRunRate } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/metrics', getMetrics);
router.get('/workflow-metrics', getWorkflowMetrics);
router.get('/charts/shipments', getShipmentsChart);
router.get('/charts/order-volume', getOrderVolumeChart);
router.get('/unacknowledged-orders-count', getUnacknowledgedCount);

// New stock analysis routes
router.get('/items-below-reorder-point', getItemsBelowReorderPoint);
router.get('/items-at-risk', getItemsAtRiskOfStockOut);
router.get('/run-rate', getCurrentRunRate);
router.post('/update-run-rate', updateRunRate);

module.exports = router;