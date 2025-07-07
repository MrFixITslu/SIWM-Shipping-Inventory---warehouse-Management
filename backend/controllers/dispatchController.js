



const dispatchService = require('../services/dispatchService');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getDispatches = async (req, res, next) => {
  try {
    const dispatches = await dispatchService.getAllDispatches();
    res.json(dispatches);
  } catch (error) { next(error); }
};
const getDispatchById = async (req, res, next) => {
  const dispatchId = parseInt(req.params.id, 10);
  if (isNaN(dispatchId)) {
    res.status(400); return next(new Error('Invalid dispatch ID format. ID must be a number.'));
  }
  try {
    const dispatch = await dispatchService.getDispatchById(dispatchId);
    if (!dispatch) { res.status(404); throw new Error('Dispatch not found'); }
    res.json(dispatch);
  } catch (error) { next(error); }
};
const createDispatch = async (req, res, next) => {
  const { orderId, carrier, trackingNumber, destinationAddress, dispatchDate, estimatedDeliveryDate, status, shippedSerialNumbers, brokerId } = req.body;
  
  if (!carrier || !trackingNumber || !destinationAddress || !dispatchDate || !estimatedDeliveryDate || !brokerId) {
    res.status(400); return next(new Error('Carrier, tracking number, destination, dates, and broker are required.'));
  }
  if (orderId && isNaN(parseInt(orderId, 10))) {
    res.status(400); return next(new Error('If provided, Order ID must be a valid number.'));
  }

  try {
    const dispatchPayload = req.body;
    if(orderId) dispatchPayload.orderId = parseInt(orderId, 10);
    const newDispatch = await dispatchService.createDispatch(dispatchPayload);
    res.status(201).json(newDispatch);
  } catch (error) { next(error); }
};
const updateDispatch = async (req, res, next) => {
  const dispatchId = parseInt(req.params.id, 10);
  if (isNaN(dispatchId)) {
    res.status(400); return next(new Error('Invalid dispatch ID format. ID must be a number.'));
  }
  try {
     if (Object.keys(req.body).length === 0) {
        res.status(400); return next(new Error('No update data provided.'));
    }
    const updatedDispatch = await dispatchService.updateDispatch(dispatchId, req.body);
    if (!updatedDispatch) { res.status(404); throw new Error('Dispatch not found for update'); }
    res.json(updatedDispatch);
  } catch (error) { next(error); }
};
const deleteDispatch = async (req, res, next) => {
  const dispatchId = parseInt(req.params.id, 10);
  if (isNaN(dispatchId)) {
    res.status(400); return next(new Error('Invalid dispatch ID format. ID must be a number.'));
  }
  try {
    const success = await dispatchService.deleteDispatch(dispatchId);
    if (!success) { res.status(404); throw new Error('Dispatch not found for deletion'); }
    res.status(204).send();
  } catch (error) { next(error); }
};
const submitFees = async (req, res, next) => {
    const dispatchId = parseInt(req.params.id, 10);
    if (isNaN(dispatchId)) {
        res.status(400); return next(new Error('Invalid dispatch ID format.'));
    }
    const { fees } = req.body;
    if (!fees || typeof fees !== 'object') {
        res.status(400); return next(new Error('Fees object is required.'));
    }
    try {
        const updatedDispatch = await dispatchService.submitFees(dispatchId, fees, req.user.id);
        res.json(updatedDispatch);
    } catch (error) { next(error); }
};
const approveFees = async (req, res, next) => {
    const dispatchId = parseInt(req.params.id, 10);
    if (isNaN(dispatchId)) {
        res.status(400); return next(new Error('Invalid dispatch ID format.'));
    }
    const { feeStatus } = req.body;
     if (!feeStatus || (feeStatus !== 'Approved' && feeStatus !== 'Rejected')) {
        res.status(400); return next(new Error('A valid feeStatus ("Approved" or "Rejected") is required.'));
    }
    try {
        const updatedDispatch = await dispatchService.approveFees(dispatchId, feeStatus, req.user.id);
        res.json(updatedDispatch);
    } catch (error) { next(error); }
};

const confirmPayment = async (req, res, next) => {
    upload.single('receipt')(req, res, async (err) => {
        if (err) return next(err);
        const dispatchId = parseInt(req.params.id, 10);
        if (isNaN(dispatchId)) {
            res.status(400); return next(new Error('Invalid dispatch ID format.'));
        }
        
        try {
            const receiptFile = req.file ? {
                name: req.file.originalname,
                data: req.file.buffer.toString('base64')
            } : null;

            const updatedDispatch = await dispatchService.confirmPayment(dispatchId, receiptFile, req.user.id);
            res.json(updatedDispatch);
        } catch (error) {
            next(error);
        }
    });
};

module.exports = { getDispatches, getDispatchById, createDispatch, updateDispatch, deleteDispatch, submitFees, approveFees, confirmPayment };