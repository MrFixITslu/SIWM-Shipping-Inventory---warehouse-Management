// backend/controllers/dashboardController.js
const dashboardServiceBackend = require('../services/dashboardServiceBackend');

const getMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardServiceBackend.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

const getWorkflowMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardServiceBackend.getWorkflowMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

const getShipmentsChart = async (req, res, next) => {
    try {
        const chartData = await dashboardServiceBackend.getShipmentChartData();
        res.json(chartData);
    } catch (error) {
        next(error);
    }
};

const getOrderVolumeChart = async (req, res, next) => {
    try {
        const chartData = await dashboardServiceBackend.getOrderVolumeChartData();
        res.json(chartData);
    } catch (error) {
        next(error);
    }
};

const getUnacknowledgedCount = async (req, res, next) => {
    try {
        const count = await dashboardServiceBackend.getUnacknowledgedOrdersCount();
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

const getItemsBelowReorderPoint = async (req, res, next) => {
    try {
        const items = await dashboardServiceBackend.getItemsBelowReorderPoint();
        res.json(items);
    } catch (error) {
        next(error);
    }
};

const getItemsAtRiskOfStockOut = async (req, res, next) => {
    try {
        const items = await dashboardServiceBackend.getItemsAtRiskOfStockOut();
        res.json(items);
    } catch (error) {
        next(error);
    }
};

const getCurrentRunRate = async (req, res, next) => {
    try {
        const runRate = await dashboardServiceBackend.getCurrentRunRate();
        res.json(runRate);
    } catch (error) {
        next(error);
    }
};

const updateRunRate = async (req, res, next) => {
    try {
        const { weeklyInstalls } = req.body;
        if (!weeklyInstalls || weeklyInstalls <= 0) {
            return res.status(400).json({ message: 'Weekly installs must be a positive number' });
        }
        const runRate = await dashboardServiceBackend.updateRunRate(weeklyInstalls);
        res.json(runRate);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMetrics,
    getShipmentsChart,
    getOrderVolumeChart,
    getUnacknowledgedCount,
    getWorkflowMetrics,
    getItemsBelowReorderPoint,
    getItemsAtRiskOfStockOut,
    getCurrentRunRate,
    updateRunRate,
};