// backend/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const {
    getInventoryItems,
    createInventoryItem,
    getInventoryItemById,
    updateInventoryItem,
    deleteInventoryItem,
    manageItemSerials,
    getUniqueCategories
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

// Base routes for inventory items
router.route('/')
    .get(protect, authorize(...ALL_ROLES), getInventoryItems)
    .post(protect, authorize('admin', 'manager'), createInventoryItem);

// Specific data routes (e.g., for populating filters)
router.route('/data/categories')
    .get(protect, authorize(...ALL_ROLES), getUniqueCategories);

router.route('/:id')
    .get(protect, authorize(...ALL_ROLES), getInventoryItemById)
    .put(protect, authorize('admin', 'manager'), updateInventoryItem)
    .delete(protect, authorize('admin'), deleteInventoryItem);

// Route for managing serial numbers of a specific item
// Warehouse staff may need to add/remove serials during receiving/picking
router.route('/:id/serials')
    .post(protect, authorize('admin', 'manager', 'Warehouse', 'Technician'), manageItemSerials);

module.exports = router;