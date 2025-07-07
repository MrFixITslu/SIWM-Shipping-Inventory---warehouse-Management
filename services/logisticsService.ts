import { BASE_API_URL, getCommonHeaders } from './apiConfig';

export interface ShippingRouteOptimization {
  optimalRoute: {
    waypoints: string[];
    estimatedTime: string;
    estimatedCost: string;
    riskFactors: string[];
  };
  alternativeRoutes: any[];
  costSavings: string;
  timeSavings: string;
  recommendations: string[];
}

export interface InventoryForecast {
  forecast: {
    nextMonth: any;
    nextQuarter: any;
    nextYear: any;
  };
  reorderPoints: any;
  riskItems: string[];
  optimizationSuggestions: string[];
}

export interface SupplierPerformanceAnalysis {
  performanceScore: number;
  onTimeDelivery: number;
  qualityRating: number;
  costEffectiveness: number;
  recommendations: string[];
  riskAssessment: string;
}

export interface WarehouseLayoutOptimization {
  optimizedLayout: any;
  efficiencyImprovements: string;
  spaceUtilization: number;
  pickPathOptimization: any;
  recommendations: string[];
}

export interface ProcurementInsights {
  costAnalysis: any;
  supplierRecommendations: string[];
  negotiationPoints: string[];
  riskMitigation: string[];
  marketOpportunities: string[];
}

class LogisticsService {
  async optimizeShippingRoute(
    origin: string, 
    destination: string, 
    constraints: any = {}
  ): Promise<ShippingRouteOptimization> {
    try {
      const response = await fetch(`${BASE_API_URL}/logistics/optimize-shipping-route`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ origin, destination, constraints }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Shipping route optimization failed with status: ${response.status}` 
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error optimizing shipping route:', error);
      throw new Error(error.message || 'Failed to optimize shipping route');
    }
  }

  async forecastInventory(
    historicalData: any, 
    currentStock: any, 
    leadTimes: any = {}
  ): Promise<InventoryForecast> {
    try {
      const response = await fetch(`${BASE_API_URL}/logistics/forecast-inventory`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ historicalData, currentStock, leadTimes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Inventory forecasting failed with status: ${response.status}` 
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error forecasting inventory:', error);
      throw new Error(error.message || 'Failed to forecast inventory');
    }
  }

  async analyzeSupplierPerformance(
    supplierData: any, 
    orderHistory: any
  ): Promise<SupplierPerformanceAnalysis> {
    try {
      const response = await fetch(`${BASE_API_URL}/logistics/analyze-supplier-performance`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ supplierData, orderHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Supplier performance analysis failed with status: ${response.status}` 
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error analyzing supplier performance:', error);
      throw new Error(error.message || 'Failed to analyze supplier performance');
    }
  }

  async optimizeWarehouseLayout(
    currentLayout: any, 
    inventoryData: any, 
    orderPatterns: any = {}
  ): Promise<WarehouseLayoutOptimization> {
    try {
      const response = await fetch(`${BASE_API_URL}/logistics/optimize-warehouse-layout`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ currentLayout, inventoryData, orderPatterns }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Warehouse layout optimization failed with status: ${response.status}` 
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error optimizing warehouse layout:', error);
      throw new Error(error.message || 'Failed to optimize warehouse layout');
    }
  }

  async generateProcurementInsights(
    procurementData: any, 
    marketTrends: any = {}
  ): Promise<ProcurementInsights> {
    try {
      const response = await fetch(`${BASE_API_URL}/logistics/generate-procurement-insights`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ procurementData, marketTrends }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Procurement insights generation failed with status: ${response.status}` 
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error generating procurement insights:', error);
      throw new Error(error.message || 'Failed to generate procurement insights');
    }
  }
}

export const logisticsService = new LogisticsService(); 