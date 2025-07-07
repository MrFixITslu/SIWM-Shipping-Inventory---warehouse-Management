import { StockOutRiskForecastItem, ASN, OutboundShipment } from '@/types';
import { api } from './apiHelper';

class AiInsightService {
  // Constructor can be empty
  constructor() {}

  async getStockOutForecast(signal?: AbortSignal): Promise<StockOutRiskForecastItem[]> {
    try {
      // The backend /ai-insights/stock-forecast endpoint now handles getting inventory, creating prompts, calling Gemini, and parsing the response.
      const result = await api.get<StockOutRiskForecastItem[]>('/ai-insights/stock-forecast', { signal });
      if (Array.isArray(result)) {
        return result; // Assuming backend returns validated data
      }
      console.warn("Stock out forecast from backend returned non-array data:", result);
      return [];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw the original AbortError
      }
      console.error("Failed to get stock out forecast via backend:", error.message);
      throw new Error(`AI Prediction Error: ${error.message}`);
    }
  }
  
  async getASNDelayPrediction(asn: ASN, signal?: AbortSignal): Promise<string> {
    try {
      // POSTing the ASN data to a dedicated backend endpoint
      const result = await api.post<{text: string}>('/ai-insights/asn-delay-prediction', { asn }, { signal });
      return result.text || "AI prediction unavailable.";
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw the original AbortError
      }
      console.error("Failed to get ASN delay prediction via backend:", error.message);
      throw new Error(`AI Prediction Error: ${error.message}`);
    }
  }

  async getRouteOptimizationSuggestion(shipments: OutboundShipment[], signal?: AbortSignal): Promise<string> {
    const relevantShipments = shipments
        .filter(s => s.status === 'Preparing' || s.status === 'In Transit')
        .map(s => ({ id: s.id, destination: s.destinationAddress, orderId: s.orderId, carrier: s.carrier }));
    
    if (relevantShipments.length === 0) return "No active shipments eligible for route optimization suggestions at this time.";

    try {
      const result = await api.post<{text: string}>('/ai-insights/route-optimization', { shipments: relevantShipments }, { signal });
      return result.text || "AI suggestion unavailable.";
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw the original AbortError
      }
      console.error("Failed to get route optimization via backend:", error.message);
      throw new Error(`AI Prediction Error: ${error.message}`);
    }
  }
}
export const aiInsightService = new AiInsightService();