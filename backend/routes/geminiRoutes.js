// backend/routes/geminiRoutes.js
const express = require('express');
const router = express.Router();
const { handleChatStream, handlePdfExtraction } = require('../controllers/geminiController');
const { protect } = require('../middleware/authMiddleware'); // Protect AI endpoints

// All Gemini routes require authentication
router.use(protect);

router.post('/chat/stream', handleChatStream);
router.post('/extract-from-pdf', handlePdfExtraction);

module.exports = router;
