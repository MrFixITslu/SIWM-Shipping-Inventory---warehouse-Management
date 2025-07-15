import { BASE_API_URL, getCommonHeaders } from './apiConfig';
import { requestCache, backgroundSyncManager } from '@/utils/serviceWorker';

interface ApiOptions {
  signal?: AbortSignal;
  cache?: boolean;
  cacheTTL?: number;
  offline?: boolean;
}

interface ApiResponse<T> {
  data: T;
  fromCache: boolean;
  offline: boolean;
}

class EnhancedApiHelper {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      if (response.status === 204) return {} as T; // No Content success
      return response.json();
    }
    
    const errorData = await response.json().catch(() => ({ 
      message: `Request failed with status ${response.status}: ${response.statusText}` 
    }));
    throw new Error(errorData.message || 'An unknown API error occurred');
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit & ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { cacheTTL = 5 * 60 * 1000, offline = false, ...fetchOptions } = options;
    const url = `${this.baseUrl}${path}`;
    const cacheKey = `${fetchOptions.method || 'GET'}:${url}`;

    // Try to get from cache first if caching is enabled
    if (fetchOptions.method === 'GET') {
      const cachedData = await requestCache.get<T>(cacheKey);
      if (cachedData) {
        return { data: cachedData, fromCache: true, offline: false };
      }
    }

    try {
      const response = await fetch(url, {
        headers: getCommonHeaders(),
        ...fetchOptions
      });

      const data = await this.handleResponse<T>(response);

      // Cache successful GET requests
      if (fetchOptions.method === 'GET' && response.ok) {
        requestCache.set(cacheKey, data, cacheTTL);
      }

      return { data, fromCache: false, offline: false };
    } catch (error) {
      // Handle offline scenarios
      if (offline || !navigator.onLine) {
        if (fetchOptions.method === 'GET') {
          const cachedData = await requestCache.get<T>(cacheKey);
          if (cachedData) {
            return { data: cachedData, fromCache: true, offline: true };
          }
        } else {
          // Store non-GET requests for background sync
          await backgroundSyncManager.syncWhenOnline({
            method: fetchOptions.method || 'POST',
            url,
            body: fetchOptions.body,
            headers: getCommonHeaders()
          });
        }
      }

      throw error;
    }
  }

  async get<T>(path: string, options?: ApiOptions): Promise<T> {
    const { cache, ...rest } = options || {};
    const response = await this.makeRequest<T>(path, { 
      method: 'GET',
      ...rest 
    });
    return response.data;
  }

  async post<T>(path: string, body: any, options?: ApiOptions): Promise<T> {
    const { cache, ...rest } = options || {};
    const response = await this.makeRequest<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...rest
    });
    return response.data;
  }

  async postForm<T>(path: string, formData: FormData, options?: ApiOptions): Promise<T> {
    const { cache, ...rest } = options || {};
    const headers = getCommonHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData
    
    const response = await this.makeRequest<T>(path, {
      method: 'POST',
      headers,
      body: formData,
      ...rest
    });
    return response.data;
  }

  async put<T>(path: string, body: any, options?: ApiOptions): Promise<T> {
    const { cache, ...rest } = options || {};
    const response = await this.makeRequest<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...rest
    });
    return response.data;
  }

  async delete(path: string, options?: ApiOptions): Promise<void> {
    const { cache, ...rest } = options || {};
    await this.makeRequest(path, {
      method: 'DELETE',
      ...rest
    });
  }

  // Batch requests for better performance
  async batch<T extends Record<string, any>>(
    requests: Record<keyof T, { path: string; method?: string; body?: any }>
  ): Promise<T> {
    const promises = Object.entries(requests).map(async ([key, request]) => {
      const method = request.method || 'GET';
      const response = await this.makeRequest(request.path, {
        method: method as any,
        body: request.body
      });
      return [key, response.data];
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results) as T;
  }

  // Polling with exponential backoff
  async poll<T>(
    path: string,
    condition: (data: T) => boolean,
    options: ApiOptions & { 
      interval?: number; 
      maxAttempts?: number; 
      backoffMultiplier?: number 
    } = {}
  ): Promise<T> {
    const { interval = 1000, maxAttempts = 10, backoffMultiplier = 1.5 } = options;
    let currentInterval = interval;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const data = await this.get<T>(path, options);
        
        if (condition(data)) {
          return data;
        }

        await new Promise(resolve => setTimeout(resolve, currentInterval));
        currentInterval *= backoffMultiplier;
        attempts++;
      } catch (error) {
        console.error(`Polling attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Polling timeout: condition not met within maximum attempts');
  }

  // Retry with exponential backoff
  async retry<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; baseDelay?: number; maxDelay?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000 } = options;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Clear cache for specific path or all
  clearCache(path?: string): void {
    if (path) {
      const cacheKey = `GET:${this.baseUrl}${path}`;
      requestCache.delete(cacheKey);
    } else {
      requestCache.clear();
    }
  }

  // Preload data for better UX
  async preload<T>(paths: string[]): Promise<void> {
    const promises = paths.map(path => 
      this.get<T>(path).catch(() => {
        // Silently fail preload requests
        console.warn(`Failed to preload: ${path}`);
      })
    );
    
    await Promise.all(promises);
  }
}

// Create enhanced API instance
export const enhancedApi = new EnhancedApiHelper(BASE_API_URL);

// Export types
export type { ApiOptions, ApiResponse }; 