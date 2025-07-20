import { StockOutRiskForecastItem, ASN, OutboundShipment } from '@/types';
import { api } from './apiHelper';

class AiInsightService {
  // Constructor can be empty
  constructor() {}

  private async retryWithDelay<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        // If it's a rate limit error and we have retries left
        if ((error.isRateLimit || error.status === 429) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  async getStockOutForecast(signal?: AbortSignal): Promise<StockOutRiskForecastItem[]> {
    try {
      return await this.retryWithDelay(async () => {
        // The backend /ai-insights/stock-forecast endpoint now handles getting inventory, creating prompts, calling Gemini, and parsing the response.
        const result = await api.get<StockOutRiskForecastItem[]>('/ai-insights/stock-forecast', { signal });
        if (Array.isArray(result)) {
          return result; // Assuming backend returns validated data
        }
        console.warn("Stock out forecast from backend returned non-array data:", result);
        return [];
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw the original AbortError
      }
      
      // Check if it's a rate limit error (429)
      if (error.isRateLimit || error.status === 429) {
        console.warn("Rate limit exceeded for AI insights:", error.message);
        throw new Error(`Rate limit exceeded. Please wait ${error.retryAfter || 60} seconds before trying again.`);
      }
      
      // Check if it's a quota exceeded error
      if (error.message && (
        error.message.includes('quota') ||
        error.message.includes('API quota limits') ||
        error.message.includes('429') ||
        error.message.includes('RESOURCE_EXHAUSTED')
      )) {
        console.warn("AI quota exceeded, using fallback data from backend");
        // The backend should now provide fallback data for quota errors
        // If we still get an error here, it means the backend fallback failed
        throw new Error("AI insights temporarily unavailable due to API quota limits. Please try again later.");
      }
      
      console.error("Failed to get stock out forecast via backend:", error.message);
      throw new Error(`AI Prediction Error: ${error.message}`);
    }
  }
  
  async getASNDelayPrediction(asn: ASN, signal?: AbortSignal): Promise<string> {
    try {
      return await this.retryWithDelay(async () => {
        // POSTing the ASN data to a dedicated backend endpoint
        const result = await api.post<{text: string}>('/ai-insights/asn-delay-prediction', { asn }, { signal });
        return result.text || "AI prediction unavailable.";
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw the original AbortError
      }
      
      // Check if it's a rate limit error (429)
      if (error.isRateLimit || error.status === 429) {
        console.warn("Rate limit exceeded for ASN prediction:", error.message);
        return `Rate limit exceeded. Please wait ${error.retryAfter || 60} seconds before trying again.`;
      }
      
      // Check if it's a quota exceeded error
      if (error.message && (
        error.message.includes('quota') ||
        error.message.includes('429') ||
        error.message.includes('RESOURCE_EXHAUSTED')
      )) {
        console.warn("AI quota exceeded for ASN prediction");
        return "AI prediction temporarily unavailable due to API quota limits. Please check carrier tracking and contact supplier for updates.";
      }
      
      console.error("Failed to get ASN delay prediction via backend:", error.message);
      return "AI prediction unavailable due to technical issues.";
    }
  }

  async getRouteOptimizationSuggestion(shipments: OutboundShipment[], signal?: AbortSignal): Promise<string> {
    const relevantShipments = shipments
        .filter(s => s.status === 'Preparing' || s.status === 'In Transit')
        .map(s => ({ id: s.id, destination: s.destinationAddress, orderId: s.orderId, carrier: s.carrier }));
    
    if (relevantShipments.length === 0) return "No active shipments eligible for route optimization suggestions at this time.";

    try {
      return await this.retryWithDelay(async () => {
        const result = await api.post<{text: string}>('/ai-insights/route-optimization', { shipments: relevantShipments }, { signal });
        return result.text || "AI suggestion unavailable.";
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw the original AbortError
      }
      
      // Check if it's a rate limit error (429)
      if (error.isRateLimit || error.status === 429) {
        console.warn("Rate limit exceeded for route optimization:", error.message);
        return `Rate limit exceeded. Please wait ${error.retryAfter || 60} seconds before trying again.`;
      }
      
      // Check if it's a quota exceeded error
      if (error.message && (
        error.message.includes('quota') ||
        error.message.includes('429') ||
        error.message.includes('RESOURCE_EXHAUSTED')
      )) {
        console.warn("AI quota exceeded for route optimization");
        return "AI route optimization temporarily unavailable due to API quota limits. Consider grouping shipments by destination area manually.";
      }
      
      console.error("Failed to get route optimization via backend:", error.message);
      return "AI suggestion unavailable due to technical issues.";
    }
  }
}
export const aiInsightService = new AiInsightService();
