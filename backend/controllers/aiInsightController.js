// backend/controllers/aiInsightController.js
const inventoryService = require('../services/inventoryService');
const geminiService = require('../services/geminiServiceBackend');

// Fallback data generator for when AI is unavailable
const generateFallbackStockForecast = (items) => {
    const criticalItems = items
        .filter(item => !item.isSerialized && item.reorderPoint > 0 && typeof item.quantity === 'number' && item.quantity < item.reorderPoint)
        .slice(0, 5)
        .map(item => ({
            sku: item.sku,
            itemName: item.name,
            currentStock: item.quantity,
            predictedStockOutDays: Math.max(1, Math.ceil((item.reorderPoint - item.quantity) / 2)), // Simple estimate
            confidence: 0.7, // Moderate confidence for fallback
            recommendedReorderQty: Math.max(item.reorderPoint * 2 - item.quantity, item.reorderPoint)
        }));
    
    return criticalItems;
};

const getStockOutForecast = async (req, res, next) => {
    try {
        const items = await inventoryService.getAllInventoryItems();
        
        const relevantItems = items
          .filter(item => !item.isSerialized && item.reorderPoint > 0 && typeof item.quantity === 'number' && item.quantity < (item.reorderPoint * 1.5))
          .map(item => ({ 
            sku: item.sku, 
            name: item.name, 
            currentStock: item.quantity, 
            reorderPoint: item.reorderPoint,
          }));

        if (relevantItems.length === 0) {
            return res.json([]);
        }

        try {
            const prompt = `Analyze the following inventory items and predict stock-out risks within the next 7-14 days. Provide a confidence score (0.0 to 1.0, e.g., 0.85) and a recommended reorder quantity.\nItems: ${JSON.stringify(relevantItems.slice(0, 20))}\nRespond ONLY with a plain JSON array of objects, with NO markdown, code blocks, or extra text. Each object should have: \"sku\" (string), \"itemName\" (string), \"currentStock\" (number), \"predictedStockOutDays\" (number, estimated days until stock out), \"confidence\" (number, 0.0-1.0), \"recommendedReorderQty\" (number).\nIf an item is not at immediate risk, it can be excluded or its predictedStockOutDays can be high (e.g., > 30). Limit the response to the top 5 most critical items.\nExample format: [{\"sku\": \"SKU001\", \"itemName\": \"Widget A\", \"currentStock\": 10, \"predictedStockOutDays\": 5, \"confidence\": 0.85, \"recommendedReorderQty\": 50}]`;
            
            const result = await geminiService.generateJson(prompt);

            if (Array.isArray(result)) {
                const validatedResult = result.filter(item => 
                    typeof item.sku === 'string' &&
                    typeof item.itemName === 'string' &&
                    typeof item.currentStock === 'number' &&
                    typeof item.predictedStockOutDays === 'number' &&
                    typeof item.confidence === 'number' &&
                    typeof item.recommendedReorderQty === 'number'
                );
                return res.json(validatedResult);
            }
            
            console.warn("Stock out forecast from Gemini returned non-array data:", result);
            return res.json([]);

        } catch (aiError) {
            console.error("AI service error, using fallback data:", aiError.message);
            
            // Check if it's a quota error
            if (aiError.message && aiError.message.includes('quota')) {
                console.log("Using fallback data due to AI quota exceeded");
                const fallbackData = generateFallbackStockForecast(items);
                return res.json(fallbackData);
            }
            
            // For other AI errors, return empty array
            return res.json([]);
        }

    } catch (error) {
        console.error("Error in getStockOutForecast:", error);
        next(error);
    }
};

const getAsnDelayPrediction = async (req, res, next) => {
    const { asn } = req.body;
    if (!asn) {
        return res.status(400).json({ message: 'ASN object is required.' });
    }
    try {
        const prompt = `Given an Advance Shipping Notice (ASN) with the following details:
        Supplier: ${asn.supplier}
        Expected Arrival: ${asn.expectedArrival}
        Current Status: ${asn.status}
        Item Count: ${asn.itemCount}
        Carrier: ${asn.carrier}
        Analyze potential delays based on common logistics factors (e.g., port congestion, carrier performance, supplier region issues).
        Respond with a concise natural language prediction about any potential delays. Start with "AI Prediction:".
        Example: "AI Prediction: High probability of 1-2 day delay due to current port congestion at origin port."`;
        
        try {
            const textResponse = await geminiService.generateText(prompt);
            res.json({ text: textResponse });
        } catch (aiError) {
            console.error("AI service error for ASN prediction:", aiError.message);
            
            // Provide fallback response
            const fallbackResponse = `AI Prediction: Unable to analyze delays at this time. Please check carrier tracking and contact supplier for updates.`;
            res.json({ text: fallbackResponse });
        }
    } catch (error) {
        next(error);
    }
};

const getRouteOptimizationSuggestion = async (req, res, next) => {
    const { shipments } = req.body;
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
        return res.status(400).json({ message: 'Shipments array is required.' });
    }
    try {
        const prompt = `Analyze the following ${shipments.length} outbound shipments and suggest a route optimization.
        Shipments: ${JSON.stringify(shipments.slice(0,10))}
        Consider general factors like grouping nearby destinations or typical traffic patterns.
        Respond with a concise natural language suggestion. Start with "AI Suggestion:".
        Example: "AI Suggestion: Group shipments for Downtown area (IDs: ${shipments.slice(0,2).map(s=>s.id).join(', ')}) for a single delivery run to save 15% on fuel and time."`;
        
        try {
            const textResponse = await geminiService.generateText(prompt);
            res.json({ text: textResponse });
        } catch (aiError) {
            console.error("AI service error for route optimization:", aiError.message);
            
            // Provide fallback response
            const fallbackResponse = `AI Suggestion: Unable to provide route optimization at this time. Consider grouping shipments by destination area manually.`;
            res.json({ text: fallbackResponse });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStockOutForecast,
    getAsnDelayPrediction,
    getRouteOptimizationSuggestion,
};