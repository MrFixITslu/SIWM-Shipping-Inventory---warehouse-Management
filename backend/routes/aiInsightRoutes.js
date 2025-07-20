// backend/routes/aiInsightRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getStockOutForecast,
    getAsnDelayPrediction,
    getRouteOptimizationSuggestion
} = require('../controllers/aiInsightController');
const { protect } = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

router.use(protect);

// Apply rate limiting to AI endpoints
const aiRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15,     // 15 requests per minute per IP (increased from 5)
    message: 'AI service rate limit exceeded. Please wait before making more requests.',
    statusCode: 429
});

router.get('/stock-forecast', aiRateLimit, getStockOutForecast);
router.post('/asn-delay-prediction', aiRateLimit, getAsnDelayPrediction);
router.post('/route-optimization', aiRateLimit, getRouteOptimizationSuggestion);

module.exports = router;