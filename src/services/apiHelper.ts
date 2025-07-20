// services/apiHelper.ts
import { BASE_API_URL, getCommonHeaders } from './apiConfig';

async function handleResponse(response: Response) {
  if (response.ok) {
    if (response.status === 204) return; // No Content success
    return response.json();
  }
  
  // Handle rate limiting (429) specifically
  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({ 
      message: 'Rate limit exceeded. Please wait before making more requests.',
      retryAfter: 60
    }));
    
    const error = new Error(errorData.message || 'Rate limit exceeded');
    (error as any).status = 429;
    (error as any).retryAfter = errorData.retryAfter;
    (error as any).isRateLimit = true;
    throw error;
  }
  
  const errorData = await response.json().catch(() => ({ 
    message: `Request failed with status ${response.status}: ${response.statusText}` 
  }));
  
  // Detect forced re-login error
  if (errorData.message && errorData.message.includes('Session expired due to role or permission change')) {
    const err = new Error(errorData.message);
    (err as any).forceLogout = true;
    // Dispatch a custom event for global handling
    window.dispatchEvent(new CustomEvent('forceLogout', { detail: { forceLogout: true, message: errorData.message } }));
    throw err;
  }
  
  // Preserve the original error message and status
  const error = new Error(errorData.message || `Request failed with status ${response.status}`);
  (error as any).status = response.status;
  (error as any).statusText = response.statusText;
  throw error;
}

export const api = {
  async get<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
    const response = await fetch(`${BASE_API_URL}${path}`, { headers: getCommonHeaders(), signal: options?.signal });
    return handleResponse(response);
  },

  async post<T>(path: string, body: any, options?: { signal?: AbortSignal }): Promise<T> {
    const response = await fetch(`${BASE_API_URL}${path}`, {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify(body),
      signal: options?.signal
    });
    return handleResponse(response);
  },
  
  async postForm<T>(path: string, formData: FormData, options?: { signal?: AbortSignal }): Promise<T> {
      const headers = getCommonHeaders();
      // Let browser set content-type for FormData
      delete headers['Content-Type'];
      const response = await fetch(`${BASE_API_URL}${path}`, {
          method: 'POST',
          headers,
          body: formData,
          signal: options?.signal
      });
      return handleResponse(response);
  },

  async put<T>(path: string, body: any, options?: { signal?: AbortSignal }): Promise<T> {
    const response = await fetch(`${BASE_API_URL}${path}`, {
      method: 'PUT',
      headers: getCommonHeaders(),
      body: JSON.stringify(body),
      signal: options?.signal
    });
    return handleResponse(response);
  },

  async delete(path: string, options?: { signal?: AbortSignal }): Promise<void> {
    const response = await fetch(`${BASE_API_URL}${path}`, {
      method: 'DELETE',
      headers: getCommonHeaders(),
      signal: options?.signal
    });
    return handleResponse(response);
  }
};