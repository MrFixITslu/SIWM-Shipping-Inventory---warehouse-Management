const express = require('express');
const router = express.Router();
const { getReport } = require('../controllers/reportingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

// Example: GET /api/v1/reports/inv_stock_levels?category=Widgets
// All authenticated users should be able to view reports.
router.get('/:reportKey', protect, authorize(...ALL_ROLES), getReport);

module.exports = router;