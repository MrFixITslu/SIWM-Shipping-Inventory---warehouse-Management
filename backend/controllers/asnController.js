// backend/controllers/asnController.js
const asnService = require('../services/asnService');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getASNs = async (req, res, next) => {
  try {
    const asns = await asnService.getAllASNs();
    res.json(asns);
  } catch (error) { next(error); }
};

const getASNById = async (req, res, next) => {
  const asnId = parseInt(req.params.id, 10);
  if (isNaN(asnId)) {
    res.status(400); return next(new Error('Invalid ASN ID format. ID must be a number.'));
  }
  try {
    const asn = await asnService.getASNById(asnId);
    if (!asn) { res.status(404); throw new Error('ASN not found'); }
    res.json(asn);
  } catch (error) { next(error); }
};

const createASN = async (req, res, next) => {
  // Handle uploaded files
  if (req.files) {
    if (req.files['quoteFile'] && req.files['quoteFile'][0]) {
      req.body.quoteFileData = req.files['quoteFile'][0].buffer.toString('base64');
      req.body.quoteFileName = req.files['quoteFile'][0].originalname;
    }
    if (req.files['poFile'] && req.files['poFile'][0]) {
      req.body.poFileData = req.files['poFile'][0].buffer.toString('base64');
      req.body.poFileName = req.files['poFile'][0].originalname;
    }
    if (req.files['invoiceFile'] && req.files['invoiceFile'][0]) {
      req.body.invoiceFileData = req.files['invoiceFile'][0].buffer.toString('base64');
      req.body.invoiceFileName = req.files['invoiceFile'][0].originalname;
    }
    if (req.files['bolFile'] && req.files['bolFile'][0]) {
      req.body.bolFileData = req.files['bolFile'][0].buffer.toString('base64');
      req.body.bolFileName = req.files['bolFile'][0].originalname;
    }
  }
  const { 
    supplier, expectedArrival, itemCount, carrier, items, status, poNumber, department, 
    poFileData, poFileName, vendorInvoiceData, vendorInvoiceName, shippingInvoiceData, 
    shippingInvoiceName, billOfLadingData, billOfLadingName, brokerId, brokerName
  } = req.body;
  
  // Basic Input Validation
  if (!poNumber || !supplier || !expectedArrival || !carrier || !department) {
    res.status(400); 
    return next(new Error('P.O. Number, Supplier, Department, Expected Arrival, and Carrier are required fields.'));
  }

  // Validate and convert itemCount
  let validatedItemCount = itemCount;
  if (typeof itemCount === 'string') {
    validatedItemCount = parseInt(itemCount, 10);
    if (isNaN(validatedItemCount) || validatedItemCount < 0) {
      res.status(400);
      return next(new Error('Item count must be a valid non-negative number.'));
    }
  } else if (typeof itemCount !== 'number' || itemCount < 0) {
    res.status(400);
    return next(new Error('Item count must be a valid non-negative number.'));
  }

  // Convert brokerId to number if it's a string
  if (brokerId && typeof brokerId === 'string') {
    const parsedBrokerId = parseInt(brokerId, 10);
    if (isNaN(parsedBrokerId)) {
      res.status(400);
      return next(new Error('Invalid broker ID format.'));
    }
    req.body.brokerId = parsedBrokerId;
  }

  // Update the request body with validated itemCount
  req.body.itemCount = validatedItemCount;

  try {
    const newASN = await asnService.createASN(req.body); // Pass camelCase body directly
    res.status(201).json(newASN);
  } catch (error) { next(error); }
};

const updateASN = async (req, res, next) => {
  const asnId = parseInt(req.params.id, 10);
  if (isNaN(asnId)) {
    res.status(400); return next(new Error('Invalid ASN ID format. ID must be a number.'));
  }
  try {
    if (Object.keys(req.body).length === 0) {
        res.status(400);
        return next(new Error('No update data provided.'));
    }

    const updatedASN = await asnService.updateASN(asnId, req.body); // Pass camelCase body directly
    if (!updatedASN) { res.status(404); throw new Error('ASN not found for update'); }
    res.json(updatedASN);
  } catch (error) { next(error); }
};

const deleteASN = async (req, res, next) => {
  const asnId = parseInt(req.params.id, 10);
  if (isNaN(asnId)) {
    res.status(400); return next(new Error('Invalid ASN ID format. ID must be a number.'));
  }
  try {
    const success = await asnService.deleteASN(asnId);
    if (!success) { res.status(404); throw new Error('ASN not found for deletion'); }
    res.status(204).send();
  } catch (error) { next(error); }
};

const submitFees = async (req, res, next) => {
    const dispatchId = parseInt(req.params.id, 10);
    if (isNaN(dispatchId)) {
        res.status(400); return next(new Error('Invalid ASN ID format.'));
    }
    const { fees } = req.body;
    if (!fees || typeof fees !== 'object') {
        res.status(400); return next(new Error('Fees object is required.'));
    }
    try {
        const updatedAsn = await asnService.submitFees(dispatchId, fees, req.user.id);
        res.json(updatedAsn);
    } catch (error) { next(error); }
};
const approveFees = async (req, res, next) => {
    const dispatchId = parseInt(req.params.id, 10);
    if (isNaN(dispatchId)) {
        res.status(400); return next(new Error('Invalid ASN ID format.'));
    }
    const { feeStatus } = req.body;
     if (!feeStatus || (feeStatus !== 'Approved' && feeStatus !== 'Rejected')) {
        res.status(400); return next(new Error('A valid feeStatus ("Approved" or "Rejected") is required.'));
    }
    try {
        const updatedAsn = await asnService.approveFees(dispatchId, feeStatus, req.user.id);
        res.json(updatedAsn);
    } catch (error) { next(error); }
};

const confirmPayment = async (req, res, next) => {
    upload.single('receipt')(req, res, async (err) => {
        if (err) return next(err);
        const asnId = parseInt(req.params.id, 10);
        if (isNaN(asnId)) {
            res.status(400); return next(new Error('Invalid ASN ID format.'));
        }
        
        try {
            const receiptFile = req.file ? {
                name: req.file.originalname,
                data: req.file.buffer.toString('base64')
            } : null;

            const updatedAsn = await asnService.confirmPayment(asnId, receiptFile, req.user.id);
            res.json(updatedAsn);
        } catch (error) {
            next(error);
        }
    });
};

const receiveShipment = async (req, res, next) => {
    const asnId = parseInt(req.params.id, 10);
    if (isNaN(asnId)) {
        res.status(400); return next(new Error('Invalid ASN ID format.'));
    }
    const { receivedItems } = req.body;
    if (!Array.isArray(receivedItems)) {
        res.status(400); return next(new Error('receivedItems array is required.'));
    }
    try {
        const updatedAsn = await asnService.receiveShipment(asnId, receivedItems, req.user.id);
        res.json(updatedAsn);
    } catch (error) { next(error); }
};

// Complete Shipment Controller
const completeShipment = async (req, res, next) => {
    const asnId = parseInt(req.params.id, 10);
    if (isNaN(asnId)) {
        res.status(400); return next(new Error('Invalid ASN ID format. ID must be a number.'));
    }
    // Role check: Only Warehouse, Manager, Admin
    const allowedRoles = ['Warehouse', 'Manager', 'Admin'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        res.status(403); return next(new Error('You do not have permission to complete shipments.'));
    }
    try {
        const updatedASN = await asnService.completeShipment(asnId, req.user.id);
        res.json(updatedASN);
    } catch (error) { next(error); }
};

module.exports = { getASNs, getASNById, createASN, updateASN, deleteASN, submitFees, approveFees, confirmPayment, receiveShipment, completeShipment };
