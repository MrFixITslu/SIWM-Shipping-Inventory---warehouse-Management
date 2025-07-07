
const express = require('express');
const router = express.Router();
const { handleSseConnection } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// All SSE connections should be protected
router.get('/', protect, handleSseConnection);

module.exports = router;
