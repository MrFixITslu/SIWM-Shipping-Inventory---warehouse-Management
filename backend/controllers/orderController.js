


const orderService = require('../services/orderService');

const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error) { next(error); }
};
const getOrderById = async (req, res, next) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    res.status(400); return next(new Error('Invalid order ID format. ID must be a number.'));
  }
  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) { res.status(404); throw new Error('Order not found'); }
    res.json(order);
  } catch (error) { next(error); }
};
const createOrder = async (req, res, next) => {
  const { department, items, priority, picker, status } = req.body;
  if (!department || typeof department !== 'string') {
    res.status(400); return next(new Error('Department (string) is required for an order.'));
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400); return next(new Error('Items array with at least one item is required.'));
  }
  try {
    const newOrder = await orderService.createOrder(req.body, req.user.id);
    res.status(201).json(newOrder);
  } catch (error) { next(error); }
};
const updateOrder = async (req, res, next) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    res.status(400); return next(new Error('Invalid order ID format. ID must be a number.'));
  }
  try {
    if (Object.keys(req.body).length === 0) {
        res.status(400); return next(new Error('No update data provided.'));
    }
    const updatedOrder = await orderService.updateOrder(orderId, req.body, req.user.id);
    if (!updatedOrder) { res.status(404); throw new Error('Order not found for update'); }
    res.json(updatedOrder);
  } catch (error) { next(error); }
};
const deleteOrder = async (req, res, next) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    res.status(400); return next(new Error('Invalid order ID format. ID must be a number.'));
  }
  try {
    const success = await orderService.deleteOrder(orderId);
    if (!success) { res.status(404); throw new Error('Order not found for deletion'); }
    res.status(204).send();
  } catch (error) { next(error); }
};
const getShippableOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getShippableOrders();
        res.json(orders);
    } catch (error) { next(error); }
};

const confirmPickup = async (req, res, next) => {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      res.status(400); return next(new Error('Invalid order ID format.'));
    }
    try {
        const updatedOrder = await orderService.confirmPickup(orderId, req.user.id);
        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

const confirmReceipt = async (req, res, next) => {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      res.status(400); return next(new Error('Invalid order ID format.'));
    }
    try {
        const updatedOrder = await orderService.confirmReceipt(orderId, req.user.id);
        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrder, deleteOrder, getShippableOrders, confirmPickup, confirmReceipt };