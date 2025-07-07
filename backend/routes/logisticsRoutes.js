const express = require('express');
const router = express.Router();
const { 
    optimizeShippingRoute, 
    forecastInventory, 
    analyzeSupplierPerformance, 
    optimizeWarehouseLayout, 
    generateProcurementInsights 
} = require('../controllers/logisticsController');
const { protect } = require('../middleware/authMiddleware');

// All logistics routes require authentication
router.use(protect);

// Shipping route optimization
router.post('/optimize-shipping-route', optimizeShippingRoute);

// Inventory forecasting
router.post('/forecast-inventory', forecastInventory);

// Supplier performance analysis
router.post('/analyze-supplier-performance', analyzeSupplierPerformance);

// Warehouse layout optimization
router.post('/optimize-warehouse-layout', optimizeWarehouseLayout);

// Procurement insights
router.post('/generate-procurement-insights', generateProcurementInsights);

module.exports = router; 