

const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, updateOrder, deleteOrder, getShippableOrders, confirmPickup, confirmReceipt } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

router.route('/')
    .get(protect, authorize(...ALL_ROLES), getOrders) 
    .post(protect, authorize('admin', 'manager', 'Requester', 'Warehouse', 'Technician'), createOrder);

router.get('/shippable', protect, authorize('admin', 'manager', 'Warehouse'), getShippableOrders); 

router.route('/:id')
    .get(protect, authorize(...ALL_ROLES), getOrderById)
    .put(protect, authorize('admin', 'manager', 'Warehouse', 'Technician'), updateOrder)
    .delete(protect, authorize('admin', 'manager'), deleteOrder);

router.post('/:id/confirm-pickup', protect, authorize('admin', 'manager', 'Warehouse', 'Technician', 'Requester', 'Contractor'), confirmPickup);
router.post('/:id/confirm-receipt', protect, authorize('admin', 'manager', 'Warehouse'), confirmReceipt);

module.exports = router;