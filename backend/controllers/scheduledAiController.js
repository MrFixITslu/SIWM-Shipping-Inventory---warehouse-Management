// backend/controllers/scheduledAiController.js
const scheduledAiService = require('../services/scheduledAiService');

// Get cached weekly insights
const getWeeklyInsights = async (req, res, next) => {
    try {
        const insights = scheduledAiService.getCachedInsights();
        
        if (!insights) {
            return res.status(404).json({
                message: 'No weekly insights available. They are generated every Monday.',
                nextRun: scheduledAiService.getStatus().nextRun
            });
        }
        
        res.json({
            success: true,
            data: insights,
            status: scheduledAiService.getStatus()
        });
        
    } catch (error) {
        console.error('Error getting weekly insights:', error);
        next(error);
    }
};

// Force generate insights (admin only)
const forceGenerateInsights = async (req, res, next) => {
    try {
        const status = scheduledAiService.getStatus();
        
        if (status.isRunning) {
            return res.status(409).json({
                message: 'AI insights generation is already running. Please wait.',
                status
            });
        }
        
        // Start generation in background
        scheduledAiService.forceGenerate().catch(error => {
            console.error('Background generation failed:', error);
        });
        
        res.json({
            success: true,
            message: 'Weekly insights generation started in background.',
            status: scheduledAiService.getStatus()
        });
        
    } catch (error) {
        console.error('Error forcing insight generation:', error);
        next(error);
    }
};

// Get service status
const getServiceStatus = async (req, res, next) => {
    try {
        const status = scheduledAiService.getStatus();
        const insights = scheduledAiService.getCachedInsights();
        
        res.json({
            success: true,
            status: {
                ...status,
                hasInsights: !!insights,
                insightsAge: insights ? 
                    Math.floor((Date.now() - new Date(insights.generatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 
                    null
            }
        });
        
    } catch (error) {
        console.error('Error getting service status:', error);
        next(error);
    }
};

// Get insights summary (for dashboard)
const getInsightsSummary = async (req, res, next) => {
    try {
        const insights = scheduledAiService.getCachedInsights();
        
        if (!insights) {
            return res.json({
                success: true,
                data: {
                    stockForecasts: [],
                    additionalInsights: [],
                    summary: {
                        totalForecasts: 0,
                        criticalAlerts: 0,
                        lastUpdated: null,
                        nextUpdate: scheduledAiService.getStatus().nextRun
                    }
                }
            });
        }
        
        const summary = {
            totalForecasts: insights.stockForecast.length,
            criticalAlerts: insights.additionalInsights.filter(i => i.severity === 'high').length,
            lastUpdated: insights.generatedAt,
            nextUpdate: scheduledAiService.getStatus().nextRun
        };
        
        res.json({
            success: true,
            data: {
                stockForecasts: insights.stockForecast,
                additionalInsights: insights.additionalInsights,
                summary
            }
        });
        
    } catch (error) {
        console.error('Error getting insights summary:', error);
        next(error);
    }
};

module.exports = {
    getWeeklyInsights,
    forceGenerateInsights,
    getServiceStatus,
    getInsightsSummary
}; 