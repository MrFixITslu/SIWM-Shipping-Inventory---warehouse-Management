

const express = require('express');
const router = express.Router();
const { getDispatches, getDispatchById, createDispatch, updateDispatch, deleteDispatch, submitFees, approveFees, confirmPayment } = require('../controllers/dispatchController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

router.route('/')
    .get(protect, authorize(...ALL_ROLES), getDispatches)
    .post(protect, authorize('admin', 'manager', 'Warehouse'), createDispatch);

router.route('/:id')
    .get(protect, authorize(...ALL_ROLES), getDispatchById)
    .put(protect, authorize('admin', 'manager', 'Warehouse'), updateDispatch)
    .delete(protect, authorize('admin'), deleteDispatch);

router.post('/:id/submit-fees', protect, authorize('Broker'), submitFees);
router.post('/:id/approve-fees', protect, authorize('Finance'), approveFees);
router.post('/:id/confirm-payment', protect, authorize('Broker'), confirmPayment);

module.exports = router;