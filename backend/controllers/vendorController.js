


// backend/controllers/vendorController.js
const vendorService = require('../services/vendorService');

const getVendors = async (req, res, next) => {
  try {
    const vendors = await vendorService.getAllVendors();
    res.json(vendors);
  } catch (error) { next(error); }
};

const getVendorById = async (req, res, next) => {
  const vendorId = parseInt(req.params.id, 10);
  if (isNaN(vendorId)) {
    res.status(400); return next(new Error('Invalid vendor ID format. ID must be a number.'));
  }
  try {
    const vendor = await vendorService.getVendorById(vendorId);
    if (!vendor) { res.status(404); throw new Error('Vendor not found'); }
    res.json(vendor);
  } catch (error) { next(error); }
};

const createVendor = async (req, res, next) => {
  const { name, email, contactPerson, products, performanceScore } = req.body;
  
  // Basic Input Validation
  if (!name || !email || !contactPerson) { 
    res.status(400); return next(new Error('Vendor name, email, and contact person are required.'));
  }
  if (performanceScore && (typeof performanceScore !== 'number' || performanceScore < 0 || performanceScore > 100)) {
    res.status(400); return next(new Error('Performance score must be a number between 0 and 100.'));
  }
  if (products && !Array.isArray(products)) {
    res.status(400); return next(new Error('Products must be an array.'));
  }

  try {
    const newVendor = await vendorService.createVendor(req.body); // Pass camelCase body directly
    res.status(201).json(newVendor);
  } catch (error) { next(error); }
};

const updateVendor = async (req, res, next) => {
  const vendorId = parseInt(req.params.id, 10);
  if (isNaN(vendorId)) {
    res.status(400); return next(new Error('Invalid vendor ID format. ID must be a number.'));
  }
  try {
    if (Object.keys(req.body).length === 0) {
        res.status(400); return next(new Error('No update data provided.'));
    }
    const { performanceScore, products } = req.body;
    
    // Basic Validation
    if (performanceScore !== undefined && (typeof performanceScore !== 'number' || performanceScore < 0 || performanceScore > 100)) {
        res.status(400); return next(new Error('Performance score must be a number between 0 and 100 if provided.'));
    }
    if (products && !Array.isArray(products)) {
      res.status(400); return next(new Error('Products must be an array if provided.'));
    }

    const updatedVendor = await vendorService.updateVendor(vendorId, req.body); // Pass camelCase body directly
    if (!updatedVendor) { res.status(404); throw new Error('Vendor not found for update'); }
    res.json(updatedVendor);
  } catch (error) { next(error); }
};

const deleteVendor = async (req, res, next) => {
  const vendorId = parseInt(req.params.id, 10);
  if (isNaN(vendorId)) {
    res.status(400); return next(new Error('Invalid vendor ID format. ID must be a number.'));
  }
  try {
    const success = await vendorService.deleteVendor(vendorId);
    if (!success) { res.status(404); throw new Error('Vendor not found for deletion'); }
    res.status(204).send();
  } catch (error) { next(error); }
};

module.exports = { getVendors, getVendorById, createVendor, updateVendor, deleteVendor };