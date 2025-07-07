const express = require('express');
const router = express.Router();
const { submitAIFeedback, getAllFeedback } = require('../controllers/aiFeedbackController');
const { protect } = require('../middleware/authMiddleware'); // Assuming feedback requires login

router.post('/', protect, submitAIFeedback);
// router.get('/', protect, authorize('admin'), getAllFeedback); // Example if you want an admin route

module.exports = router;
