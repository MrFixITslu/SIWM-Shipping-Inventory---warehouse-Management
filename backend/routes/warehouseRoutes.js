// backend/routes/warehouseRoutes.js
const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseZones,
  getWarehouseAisles,
  getWarehouseShelves,
  getWarehouseCapacity,
  getWarehousePerformance,
  getInventoryMovements,
  createInventoryMovement
} = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

// Base warehouse routes
router.route('/')
  .get(protect, authorize(...ALL_ROLES), getWarehouses)
  .post(protect, authorize('admin', 'manager'), createWarehouse);

router.route('/:id')
  .get(protect, authorize(...ALL_ROLES), getWarehouseById)
  .put(protect, authorize('admin', 'manager'), updateWarehouse)
  .delete(protect, authorize('admin'), deleteWarehouse);

// Warehouse zones
router.get('/:warehouseId/zones', protect, authorize(...ALL_ROLES), getWarehouseZones);

// Warehouse aisles
router.get('/:warehouseId/aisles', protect, authorize(...ALL_ROLES), getWarehouseAisles);

// Warehouse shelves
router.get('/:warehouseId/shelves', protect, authorize(...ALL_ROLES), getWarehouseShelves);

// Warehouse capacity
router.get('/:warehouseId/capacity', protect, authorize(...ALL_ROLES), getWarehouseCapacity);

// Warehouse performance
router.get('/:warehouseId/performance', protect, authorize(...ALL_ROLES), getWarehousePerformance);

// Inventory movements
router.route('/:warehouseId/movements')
  .get(protect, authorize(...ALL_ROLES), getInventoryMovements)
  .post(protect, authorize('admin', 'manager', 'Warehouse', 'Technician'), createInventoryMovement);

module.exports = router; 