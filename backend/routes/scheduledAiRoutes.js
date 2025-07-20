// backend/routes/scheduledAiRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getWeeklyInsights,
    forceGenerateInsights,
    getServiceStatus,
    getInsightsSummary
} = require('../controllers/scheduledAiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Get weekly insights (cached)
router.get('/weekly-insights', getWeeklyInsights);

// Get insights summary for dashboard
router.get('/insights-summary', getInsightsSummary);

// Get service status
router.get('/status', getServiceStatus);

// Force generate insights (admin only - could add admin middleware here)
router.post('/force-generate', forceGenerateInsights);

module.exports = router; 