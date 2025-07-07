// backend/routes/aiInsightRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getStockOutForecast,
    getAsnDelayPrediction,
    getRouteOptimizationSuggestion
} = require('../controllers/aiInsightController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stock-forecast', getStockOutForecast);
router.post('/asn-delay-prediction', getAsnDelayPrediction);
router.post('/route-optimization', getRouteOptimizationSuggestion);

module.exports = router;