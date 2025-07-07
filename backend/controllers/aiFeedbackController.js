
// backend/controllers/aiFeedbackController.js
const aiFeedbackServiceBackend = require('../services/aiFeedbackServiceBackend');

const submitAIFeedback = async (req, res, next) => {
  const { suggestionId, page, rating, comment } = req.body; 
  
  // Basic Input Validation
  if (!suggestionId || !page || !rating) {
    res.status(400); 
    return next(new Error('Suggestion ID, page, and rating are required for AI feedback.'));
  }
  if (typeof suggestionId !== 'string' || typeof page !== 'string' || typeof rating !== 'string') {
    res.status(400);
    return next(new Error('Suggestion ID, page, and rating must be strings.'));
  }
  if (!['helpful', 'unhelpful'].includes(rating.toLowerCase())) {
    res.status(400);
    return next(new Error('Rating must be "helpful" or "unhelpful".'));
  }
  if (comment && typeof comment !== 'string') {
     res.status(400);
     return next(new Error('Comment must be a string if provided.'));
  }

  try {
    const feedbackData = { 
        suggestion_id: suggestionId, 
        page, 
        rating: rating.toLowerCase(), // Ensure consistent case
        comment: comment || null,
    };
    const savedFeedback = await aiFeedbackServiceBackend.saveAIFeedback(feedbackData, req.user.id);
    res.status(201).json(savedFeedback);
  } catch (error) {
    next(error);
  }
};

// Optional: Get all feedback (for admin)
const getAllFeedback = async (req, res, next) => {
    // Add role check here if only for admins: if (req.user.role !== 'admin') return res.status(403).json(...)
    try {
        const feedbackEntries = await aiFeedbackServiceBackend.getAllAIFeedback();
        res.json(feedbackEntries);
    } catch (error) {
        next(error);
    }
};

module.exports = { submitAIFeedback, getAllFeedback };
