// backend/services/scheduledAiService.js
const cron = require('node-cron');
const aiInsightController = require('../controllers/aiInsightController');
const inventoryService = require('./inventoryService');
const { createMockRequest, createMockResponse } = require('../utils/mockHttp');

class ScheduledAiService {
    constructor() {
        this.isRunning = false;
        this.lastRun = null;
        this.nextRun = null;
        this.cache = new Map();
        this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }

    // Initialize the scheduled task
    init() {
        console.log('[ScheduledAiService] Initializing weekly AI insights generation...');
        
        // Schedule task to run every Monday at 9:00 AM
        cron.schedule('0 9 * * 1', () => {
            this.generateWeeklyInsights();
        }, {
            timezone: 'UTC'
        });

        // Also schedule for different timezones if needed
        // Monday 9 AM EST (UTC-5)
        cron.schedule('0 14 * * 1', () => {
            this.generateWeeklyInsights();
        }, {
            timezone: 'UTC'
        });

        // Monday 9 AM PST (UTC-8)
        cron.schedule('0 17 * * 1', () => {
            this.generateWeeklyInsights();
        }, {
            timezone: 'UTC'
        });

        console.log('[ScheduledAiService] Weekly AI insights scheduled for every Monday at 9:00 AM');
        
        // Calculate next run time
        this.calculateNextRun();
    }

    // Calculate next run time
    calculateNextRun() {
        const now = new Date();
        const nextMonday = new Date(now);
        
        // Find next Monday
        const daysUntilMonday = (8 - now.getDay()) % 7;
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 0, 0, 0);
        
        this.nextRun = nextMonday;
        console.log(`[ScheduledAiService] Next run scheduled for: ${this.nextRun.toISOString()}`);
    }

    // Generate weekly insights
    async generateWeeklyInsights() {
        if (this.isRunning) {
            console.log('[ScheduledAiService] Already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('[ScheduledAiService] Starting weekly AI insights generation...');

        try {
            const startTime = Date.now();
            
            // Generate stock forecast
            const stockForecast = await this.generateStockForecast();
            
            // Generate additional insights
            const additionalInsights = await this.generateAdditionalInsights();
            
            // Cache the results
            const insights = {
                stockForecast,
                additionalInsights,
                generatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + this.cacheExpiry).toISOString()
            };
            
            this.cache.set('weeklyInsights', insights);
            this.lastRun = new Date();
            
            const duration = Date.now() - startTime;
            console.log(`[ScheduledAiService] Weekly insights generated successfully in ${duration}ms`);
            console.log(`[ScheduledAiService] Stock forecasts: ${stockForecast.length}, Additional insights: ${additionalInsights.length}`);
            
        } catch (error) {
            console.error('[ScheduledAiService] Error generating weekly insights:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Generate stock forecast using the existing controller
    async generateStockForecast() {
        try {
            const mockReq = createMockRequest();
            const mockRes = createMockResponse();
            
            await aiInsightController.getStockOutForecast(mockReq, mockRes, () => {});
            
            if (mockRes.statusCode === 200) {
                return mockRes.data || [];
            } else {
                console.warn('[ScheduledAiService] Failed to generate stock forecast, using fallback');
                return this.generateFallbackStockForecast();
            }
        } catch (error) {
            console.error('[ScheduledAiService] Error in stock forecast generation:', error);
            return this.generateFallbackStockForecast();
        }
    }

    // Generate additional insights
    async generateAdditionalInsights() {
        const insights = [];
        
        try {
            // Get inventory summary
            const items = await inventoryService.getAllInventoryItems();
            
            // Low stock analysis
            const lowStockItems = items.filter(item => 
                !item.isSerialized && 
                item.reorderPoint > 0 && 
                item.quantity < item.reorderPoint
            );
            
            if (lowStockItems.length > 0) {
                insights.push({
                    type: 'lowStock',
                    title: 'Low Stock Alert',
                    message: `${lowStockItems.length} items are below reorder point`,
                    severity: 'high',
                    items: lowStockItems.slice(0, 5).map(item => ({
                        name: item.name,
                        sku: item.sku,
                        current: item.quantity,
                        reorderPoint: item.reorderPoint
                    }))
                });
            }
            
            // Category analysis
            const categoryStats = this.analyzeCategories(items);
            insights.push({
                type: 'categoryAnalysis',
                title: 'Category Performance',
                message: 'Inventory distribution by category',
                severity: 'medium',
                data: categoryStats
            });
            
            // Trend analysis (simplified)
            insights.push({
                type: 'trendAnalysis',
                title: 'Weekly Trends',
                message: 'Inventory movement patterns',
                severity: 'low',
                data: {
                    totalItems: items.length,
                    serializedItems: items.filter(i => i.isSerialized).length,
                    averageStock: Math.round(items.reduce((sum, i) => sum + (i.quantity || 0), 0) / items.length)
                }
            });
            
        } catch (error) {
            console.error('[ScheduledAiService] Error generating additional insights:', error);
        }
        
        return insights;
    }

    // Analyze inventory by category
    analyzeCategories(items) {
        const categories = {};
        
        items.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = {
                    count: 0,
                    totalValue: 0,
                    lowStock: 0
                };
            }
            
            categories[category].count++;
            categories[category].totalValue += (item.quantity || 0) * (item.unitPrice || 0);
            
            if (item.reorderPoint && item.quantity < item.reorderPoint) {
                categories[category].lowStock++;
            }
        });
        
        return Object.entries(categories).map(([name, stats]) => ({
            name,
            ...stats,
            averageValue: Math.round(stats.totalValue / stats.count)
        }));
    }

    // Generate fallback stock forecast
    generateFallbackStockForecast() {
        console.log('[ScheduledAiService] Generating fallback stock forecast...');
        
        // This would typically use cached data or simplified logic
        return [
            {
                sku: 'FALLBACK-001',
                itemName: 'Sample Item',
                currentStock: 10,
                predictedStockOutDays: 7,
                confidence: 0.7,
                recommendedReorderQty: 50,
                isFallback: true
            }
        ];
    }

    // Get cached insights
    getCachedInsights() {
        const cached = this.cache.get('weeklyInsights');
        
        if (!cached) {
            return null;
        }
        
        // Check if cache is expired
        if (new Date() > new Date(cached.expiresAt)) {
            console.log('[ScheduledAiService] Cache expired, clearing...');
            this.cache.delete('weeklyInsights');
            return null;
        }
        
        return cached;
    }

    // Force generate insights (for manual trigger)
    async forceGenerate() {
        console.log('[ScheduledAiService] Force generating insights...');
        await this.generateWeeklyInsights();
    }

    // Get service status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            nextRun: this.nextRun,
            hasCachedData: this.cache.has('weeklyInsights'),
            cacheSize: this.cache.size
        };
    }
}

module.exports = new ScheduledAiService(); 