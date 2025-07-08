const express = require('express');
const router = express.Router();
const { getASNs, getASNById, createASN, updateASN, deleteASN, submitFees, approveFees, confirmPayment, receiveShipment, completeShipment } = require('../controllers/asnController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

router.route('/')
    .get(protect, authorize(...ALL_ROLES), getASNs)
    .post(protect, authorize('admin', 'manager', 'Warehouse'), createASN);

router.route('/:id')
    .get(protect, authorize(...ALL_ROLES), getASNById)
    .put(protect, authorize('admin', 'manager', 'Warehouse'), updateASN)
    .delete(protect, authorize('admin', 'manager'), deleteASN);

router.post('/:id/submit-fees', protect, authorize('Broker'), submitFees);
router.post('/:id/approve-fees', protect, authorize('Finance'), approveFees);
router.post('/:id/confirm-payment', protect, authorize('Broker'), confirmPayment);
router.post('/:id/receive', protect, authorize('admin', 'manager', 'Warehouse'), receiveShipment);
router.post('/:id/complete', protect, authorize('Warehouse', 'manager', 'admin'), completeShipment);

module.exports = router;