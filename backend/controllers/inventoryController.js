

// backend/controllers/inventoryController.js
const inventoryService = require('../services/inventoryService');

// @desc    Fetch all inventory items
// @route   GET /api/v1/inventory
// @access  Public (or Private based on app requirements)
const getInventoryItems = async (req, res, next) => {
  try {
    const items = await inventoryService.getAllInventoryItems();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new inventory item
// @route   POST /api/v1/inventory
// @access  Private
const createInventoryItem = async (req, res, next) => {
  const { name, sku, category, location } = req.body;
  
  if (!name || !sku || !category || !location ) {
    res.status(400);
    return next(new Error('Name, SKU, category, and location are required for an inventory item'));
  }

  try {
    const item = await inventoryService.createInventoryItem(req.body); // Pass camelCase body directly
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch single inventory item by ID
// @route   GET /api/v1/inventory/:id
// @access  Public (or Private)
const getInventoryItemById = async (req, res, next) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) {
    res.status(400); return next(new Error('Invalid inventory item ID format. ID must be a number.'));
  }
  try {
    const item = await inventoryService.getInventoryItemById(itemId);
    if (item) {
      res.json(item);
    } else {
      res.status(404);
      throw new Error('Inventory item not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update an inventory item
// @route   PUT /api/v1/inventory/:id
// @access  Private
const updateInventoryItem = async (req, res, next) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) {
    res.status(400); return next(new Error('Invalid inventory item ID format. ID must be a number.'));
  }
  try {
    if (Object.keys(req.body).length === 0) {
        res.status(400); return next(new Error('No update data provided.'));
    }
    
    const item = await inventoryService.updateInventoryItem(itemId, req.body); // Pass camelCase body directly
    if (item) {
      res.json(item);
    } else {
      res.status(404);
      throw new Error('Inventory item not found for update');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an inventory item
// @route   DELETE /api/v1/inventory/:id
// @access  Private
const deleteInventoryItem = async (req, res, next) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) {
    res.status(400); return next(new Error('Invalid inventory item ID format. ID must be a number.'));
  }
  try {
    const success = await inventoryService.deleteInventoryItem(itemId);
    if (success) {
      res.status(204).send(); // No Content
    } else {
      res.status(404);
      throw new Error('Inventory item not found for deletion');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Manage serial numbers for an item (sets the list of serials)
// @route   POST /api/v1/inventory/:id/serials
// @access  Private
const manageItemSerials = async (req, res, next) => {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      res.status(400); return next(new Error('Invalid inventory item ID format. ID must be a number.'));
    }
    const { serials } = req.body; 
    if (!Array.isArray(serials)) {
        res.status(400);
        return next(new Error('Serials data must be an array'));
    }
    if (serials.some(s => typeof s !== 'string' || s.trim() === '')) {
        res.status(400);
        return next(new Error('All serial numbers must be non-empty strings.'));
    }
    if (new Set(serials).size !== serials.length) {
        res.status(400);
        return next(new Error('Serial numbers must be unique.'));
    }

    try {
        const item = await inventoryService.manageSerials(itemId, serials);
        if (item) {
            res.json(item);
        } else {
            res.status(404); 
            throw new Error('Inventory item not found or error in serial management');
        }
    } catch (error) {
        if (error.message.includes("Cannot manage serials")) {
            res.status(400); 
        }
        next(error);
    }
};

const getUniqueCategories = async (req, res, next) => {
    try {
        const categories = await inventoryService.getUniqueCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getInventoryItems,
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  manageItemSerials,
  getUniqueCategories,
};