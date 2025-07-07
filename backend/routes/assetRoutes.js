// backend/routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getMaintenanceForAsset,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

// GET all assets & POST a new asset
router.route('/')
  .get(protect, authorize(...ALL_ROLES), getAssets)
  .post(protect, authorize('admin', 'manager'), createAsset);

// GET, PUT, DELETE a single asset by ID
router.route('/:id')
  .get(protect, authorize(...ALL_ROLES), getAssetById)
  .put(protect, authorize('admin', 'manager'), updateAsset)
  .delete(protect, authorize('admin'), deleteAsset);

// Maintenance Records routes
router.route('/:assetId/maintenance')
    .get(protect, authorize('admin', 'manager', 'Warehouse', 'Technician', 'Contractor'), getMaintenanceForAsset)
    .post(protect, authorize('admin', 'manager'), addMaintenance);

router.route('/:assetId/maintenance/:recordId')
    .put(protect, authorize('admin', 'manager'), updateMaintenance)
    .delete(protect, authorize('admin', 'manager'), deleteMaintenance);

module.exports = router;