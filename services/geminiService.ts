
import { ChatMessage } from '@/types';
import { BASE_API_URL, getCommonHeaders } from './apiConfig'; // Assuming BASE_API_URL is configured

class GeminiService {
  // No local AI or Chat instance needed anymore

  constructor() {
    // Constructor can be empty or perform other initializations if needed
  }

  public async sendChatMessageStream(message: string, history: ChatMessage[], signal?: AbortSignal): Promise<AsyncIterable<string>> {
    try {
      const response = await fetch(`${BASE_API_URL}/gemini/chat/stream`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ message, history }),
        signal, // Pass the abort signal to the fetch request
      });

      if (!response.ok) {
        // Attempt to parse error from backend
        const errorData = await response.json().catch(() => ({ message: `Chat stream failed with status: ${response.status}` }));
        throw new Error(errorData.message || `Chat stream failed with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null for chat stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      async function* streamGenerator(): AsyncIterable<string> {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            yield decoder.decode(value, { stream: true });
          }
        } finally {
          reader.releaseLock();
        }
      }
      return streamGenerator();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Chat stream aborted by user.');
        // Return an empty async generator so the calling loop terminates gracefully
        async function* emptyStream() {}
        return emptyStream();
      }
      console.error("Error sending message via backend stream:", error);
      async function* errorStream() {
        yield `Sorry, I encountered an error: ${error.message || "Please try again later."}`;
      }
      return errorStream();
    }
  }
}

export const geminiService = new GeminiService();