// backend/routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const { getVendors, getVendorById, createVendor, updateVendor, deleteVendor } = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

router.route('/')
    .get(protect, authorize(...ALL_ROLES), getVendors)
    .post(protect, authorize('admin', 'manager'), createVendor);

router.route('/:id')
    .get(protect, authorize(...ALL_ROLES), getVendorById)
    .put(protect, authorize('admin', 'manager'), updateVendor)
    .delete(protect, authorize('admin'), deleteVendor);

module.exports = router;