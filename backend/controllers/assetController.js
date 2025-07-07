
// backend/controllers/assetController.js
const assetService = require('../services/assetService');

// @desc    Fetch all assets
// @route   GET /api/v1/assets
// @access  Public (or Private if auth is added to route)
const getAssets = async (req, res, next) => {
  try {
    const assets = await assetService.getAllAssets();
    res.json(assets);
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch single asset by ID
// @route   GET /api/v1/assets/:id
// @access  Public (or Private)
const getAssetById = async (req, res, next) => {
  const assetId = parseInt(req.params.id, 10);
  if (isNaN(assetId)) {
    res.status(400); return next(new Error('Invalid asset ID format. ID must be a number.'));
  }
  try {
    const asset = await assetService.getAssetById(assetId);
    if (asset) {
      res.json(asset);
    } else {
      res.status(404);
      throw new Error('Asset not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new asset
// @route   POST /api/v1/assets
// @access  Private (requires authentication via 'protect' middleware in routes)
const createAsset = async (req, res, next) => {
  const { name, assetType, location, status, purchaseDate } = req.body;
  
  if (!name || !assetType || !location || !status || !purchaseDate) {
    res.status(400);
    return next(new Error('Name, assetType, location, status, and purchaseDate are required'));
  }

  try {
    const asset = await assetService.createAsset(req.body); // Pass camelCase body directly
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an asset
// @route   PUT /api/v1/assets/:id
// @access  Private
const updateAsset = async (req, res, next) => {
  const assetId = parseInt(req.params.id, 10);
  if (isNaN(assetId)) {
    res.status(400); return next(new Error('Invalid asset ID format. ID must be a number.'));
  }
  try {
    if (Object.keys(req.body).length === 0) {
        res.status(400); return next(new Error('No update data provided.'));
    }
    const asset = await assetService.updateAsset(assetId, req.body); // Pass camelCase body directly

    if (asset) {
      res.json(asset);
    } else {
      res.status(404);
      throw new Error('Asset not found for update');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an asset
// @route   DELETE /api/v1/assets/:id
// @access  Private
const deleteAsset = async (req, res, next) => {
  const assetId = parseInt(req.params.id, 10);
  if (isNaN(assetId)) {
    res.status(400); return next(new Error('Invalid asset ID format. ID must be a number.'));
  }
  try {
    const success = await assetService.deleteAsset(assetId);
    if (success) {
      res.status(204).send(); // No Content
    } else {
      res.status(404);
      throw new Error('Asset not found for deletion');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Example of a protected route handler
// @route   GET /api/v1/assets/protected-example
// @access  Private
const getProtectedAssetExample = async (req, res, next) => { 
    try {
        res.json({ 
            message: "This is a protected asset route example.",
            user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role }
        });
    } catch (error) {
        next(error);
    }
};

// Maintenance Record Controllers
const getMaintenanceForAsset = async (req, res, next) => {
    const assetId = parseInt(req.params.assetId, 10);
    if (isNaN(assetId)) {
      res.status(400); return next(new Error('Invalid asset ID format for fetching maintenance.'));
    }
    try {
        const records = await assetService.getMaintenanceRecordsByAssetId(assetId);
        res.json(records);
    } catch(error) { next(error); }
};
const addMaintenance = async (req, res, next) => {
    const assetId = parseInt(req.params.assetId, 10);
    if (isNaN(assetId)) {
      res.status(400); return next(new Error('Invalid asset ID format for adding maintenance.'));
    }
    const { date, type, description } = req.body;
    if(!date || !type || !description) {
        res.status(400); return next(new Error('Date, type, and description are required for maintenance record.'));
    }
    try {
        const record = await assetService.addMaintenanceRecord(assetId, req.body); // Pass camelCase body
        res.status(201).json(record);
    } catch(error) { next(error); }
};
const updateMaintenance = async (req, res, next) => {
    const recordId = parseInt(req.params.recordId, 10);
    if (isNaN(recordId)) {
      res.status(400); return next(new Error('Invalid maintenance record ID format.'));
    }
    try {
        if (Object.keys(req.body).length === 0) {
            res.status(400); return next(new Error('No update data provided for maintenance record.'));
        }
        const record = await assetService.updateMaintenanceRecord(recordId, req.body); // Pass camelCase body
        if(!record) { res.status(404); throw new Error('Maintenance record not found for update.'); }
        res.json(record);
    } catch(error) { next(error); }
};
const deleteMaintenance = async (req, res, next) => {
    const recordId = parseInt(req.params.recordId, 10);
    if (isNaN(recordId)) {
      res.status(400); return next(new Error('Invalid maintenance record ID format.'));
    }
    try {
        const success = await assetService.deleteMaintenanceRecord(recordId);
        if(!success) { res.status(404); throw new Error('Maintenance record not found for deletion.'); }
        res.status(204).send();
    } catch(error) { next(error); }
};


module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getProtectedAssetExample,
  getMaintenanceForAsset,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
};