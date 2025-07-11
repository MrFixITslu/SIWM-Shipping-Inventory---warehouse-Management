// backend/routes/supportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSupportTickets,
  getSupportTicketById,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  getTicketResponses,
  addTicketResponse,
  getSupportDashboardMetrics,
  getSupportTicketTrends
} = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

// Support ticket routes
router.route('/')
  .get(protect, authorize(...ALL_ROLES), getSupportTickets)
  .post(protect, authorize(...ALL_ROLES), createSupportTicket);

router.route('/:id')
  .get(protect, authorize(...ALL_ROLES), getSupportTicketById)
  .put(protect, authorize(...ALL_ROLES), updateSupportTicket)
  .delete(protect, authorize('admin', 'manager'), deleteSupportTicket);

// Ticket responses
router.route('/:ticketId/responses')
  .get(protect, authorize(...ALL_ROLES), getTicketResponses)
  .post(protect, authorize(...ALL_ROLES), addTicketResponse);

// Dashboard metrics
router.get('/dashboard/metrics', protect, authorize(...ALL_ROLES), getSupportDashboardMetrics);
router.get('/dashboard/trends', protect, authorize(...ALL_ROLES), getSupportTicketTrends);

module.exports = router; 