// services/aiFeedbackFrontendService.ts
import { BASE_API_URL, getCommonHeaders } from './apiConfig';

interface AIFeedbackPayload {
  suggestionId: string;
  page: string; // e.g., 'DashboardPage', 'InventoryManagementPage'
  rating: 'helpful' | 'unhelpful';
  comment?: string;
}

export const aiFeedbackFrontendService = {
  submitFeedback: async (feedbackData: AIFeedbackPayload): Promise<any> => {
    const response = await fetch(`${BASE_API_URL}/ai-feedback`, {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) { 
      const err = await response.json().catch(() => ({message: response.statusText})); 
      throw new Error(err.message || `Failed to submit AI feedback: ${response.statusText}`);
    }
    return response.json();
  },
};