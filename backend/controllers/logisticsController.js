const geminiServiceBackend = require('../services/geminiServiceBackend');

const optimizeShippingRoute = async (req, res, next) => {
    try {
        const { origin, destination, constraints } = req.body;
        
        if (!origin || !destination) {
            return res.status(400).json({ 
                message: 'Origin and destination are required.' 
            });
        }

        const optimization = await geminiServiceBackend.optimizeShippingRoute(
            origin, 
            destination, 
            constraints || {}
        );

        res.json({
            success: true,
            data: optimization
        });
    } catch (error) {
        console.error('Error in optimizeShippingRoute:', error.message);
        const statusCode = error.message.includes("not available") ? 503 : 500;
        res.status(statusCode).json({ 
            message: error.message || "Error optimizing shipping route." 
        });
    }
};

const forecastInventory = async (req, res, next) => {
    try {
        const { historicalData, currentStock, leadTimes } = req.body;
        
        if (!historicalData || !currentStock) {
            return res.status(400).json({ 
                message: 'Historical data and current stock are required.' 
            });
        }

        const forecast = await geminiServiceBackend.forecastInventory(
            historicalData, 
            currentStock, 
            leadTimes || {}
        );

        res.json({
            success: true,
            data: forecast
        });
    } catch (error) {
        console.error('Error in forecastInventory:', error.message);
        const statusCode = error.message.includes("not available") ? 503 : 500;
        res.status(statusCode).json({ 
            message: error.message || "Error forecasting inventory." 
        });
    }
};

const analyzeSupplierPerformance = async (req, res, next) => {
    try {
        const { supplierData, orderHistory } = req.body;
        
        if (!supplierData || !orderHistory) {
            return res.status(400).json({ 
                message: 'Supplier data and order history are required.' 
            });
        }

        const analysis = await geminiServiceBackend.analyzeSupplierPerformance(
            supplierData, 
            orderHistory
        );

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error in analyzeSupplierPerformance:', error.message);
        const statusCode = error.message.includes("not available") ? 503 : 500;
        res.status(statusCode).json({ 
            message: error.message || "Error analyzing supplier performance." 
        });
    }
};

const optimizeWarehouseLayout = async (req, res, next) => {
    try {
        const { currentLayout, inventoryData, orderPatterns } = req.body;
        
        if (!currentLayout || !inventoryData) {
            return res.status(400).json({ 
                message: 'Current layout and inventory data are required.' 
            });
        }

        const optimization = await geminiServiceBackend.optimizeWarehouseLayout(
            currentLayout, 
            inventoryData, 
            orderPatterns || {}
        );

        res.json({
            success: true,
            data: optimization
        });
    } catch (error) {
        console.error('Error in optimizeWarehouseLayout:', error.message);
        const statusCode = error.message.includes("not available") ? 503 : 500;
        res.status(statusCode).json({ 
            message: error.message || "Error optimizing warehouse layout." 
        });
    }
};

const generateProcurementInsights = async (req, res, next) => {
    try {
        const { procurementData, marketTrends } = req.body;
        
        if (!procurementData) {
            return res.status(400).json({ 
                message: 'Procurement data is required.' 
            });
        }

        const insights = await geminiServiceBackend.generateProcurementInsights(
            procurementData, 
            marketTrends || {}
        );

        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        console.error('Error in generateProcurementInsights:', error.message);
        const statusCode = error.message.includes("not available") ? 503 : 500;
        res.status(statusCode).json({ 
            message: error.message || "Error generating procurement insights." 
        });
    }
};

module.exports = {
    optimizeShippingRoute,
    forecastInventory,
    analyzeSupplierPerformance,
    optimizeWarehouseLayout,
    generateProcurementInsights,
}; 