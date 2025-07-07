const express = require('express');
const router = express.Router();
const { resetTransactionalData } = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { addClient } = require('../services/sseService');

router.post('/reset-transactional-data', protect, authorize('admin'), resetTransactionalData);

// SSE endpoint
router.get('/sse', (req, res) => {
  // Set CORS headers for SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  addClient(res);
});

module.exports = router;
