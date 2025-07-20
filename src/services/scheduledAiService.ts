// src/services/scheduledAiService.ts
import { api } from './apiHelper';

export interface WeeklyInsights {
    stockForecast: StockOutRiskForecastItem[];
    additionalInsights: AdditionalInsight[];
    generatedAt: string;
    expiresAt: string;
}

export interface StockOutRiskForecastItem {
    sku: string;
    itemName: string;
    currentStock: number;
    predictedStockOutDays: number;
    confidence: number;
    recommendedReorderQty: number;
    isFallback?: boolean;
}

export interface AdditionalInsight {
    type: 'lowStock' | 'categoryAnalysis' | 'trendAnalysis';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    data?: any;
    items?: Array<{
        name: string;
        sku: string;
        current: number;
        reorderPoint: number;
    }>;
}

export interface InsightsSummary {
    stockForecasts: StockOutRiskForecastItem[];
    additionalInsights: AdditionalInsight[];
    summary: {
        totalForecasts: number;
        criticalAlerts: number;
        lastUpdated: string | null;
        nextUpdate: string | null;
    };
}

export interface ServiceStatus {
    isRunning: boolean;
    lastRun: string | null;
    nextRun: string | null;
    hasCachedData: boolean;
    cacheSize: number;
    hasInsights: boolean;
    insightsAge: number | null;
}

class ScheduledAiService {
    async getWeeklyInsights(): Promise<WeeklyInsights | null> {
        try {
            const response = await api.get<{ success: boolean; data: WeeklyInsights }>('/scheduled-ai/weekly-insights');
            return response.data;
        } catch (error: any) {
            if (error.status === 404) {
                console.log('No weekly insights available yet');
                return null;
            }
            console.error('Failed to get weekly insights:', error);
            throw error;
        }
    }

    async getInsightsSummary(): Promise<InsightsSummary> {
        try {
            const response = await api.get<{ success: boolean; data: InsightsSummary }>('/scheduled-ai/insights-summary');
            return response.data;
        } catch (error: any) {
            console.error('Failed to get insights summary:', error);
            // Return empty summary on error
            return {
                stockForecasts: [],
                additionalInsights: [],
                summary: {
                    totalForecasts: 0,
                    criticalAlerts: 0,
                    lastUpdated: null,
                    nextUpdate: null
                }
            };
        }
    }

    async getServiceStatus(): Promise<ServiceStatus> {
        try {
            const response = await api.get<{ success: boolean; status: ServiceStatus }>('/scheduled-ai/status');
            return response.status;
        } catch (error: any) {
            console.error('Failed to get service status:', error);
            throw error;
        }
    }

    async forceGenerateInsights(): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.post<{ success: boolean; message: string }>('/scheduled-ai/force-generate', {});
            return response;
        } catch (error: any) {
            console.error('Failed to force generate insights:', error);
            throw error;
        }
    }

    // Helper method to check if insights are fresh (less than 7 days old)
    isInsightsFresh(insights: WeeklyInsights): boolean {
        const generatedAt = new Date(insights.generatedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
    }

    // Helper method to get next Monday
    getNextMonday(): Date {
        const now = new Date();
        const nextMonday = new Date(now);
        const daysUntilMonday = (8 - now.getDay()) % 7;
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 0, 0, 0);
        return nextMonday;
    }

    // Helper method to format time until next update
    getTimeUntilNextUpdate(nextUpdate: string | null): string {
        if (!nextUpdate) return 'Unknown';
        
        const next = new Date(nextUpdate);
        const now = new Date();
        const diff = next.getTime() - now.getTime();
        
        if (diff <= 0) return 'Now';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
    }
}

export const scheduledAiService = new ScheduledAiService(); 