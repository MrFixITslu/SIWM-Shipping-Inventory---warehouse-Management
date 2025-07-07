// Service Worker Registration and PWA utilities

interface OfflineAction {
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.setupOnlineOfflineListeners();
  }

  async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Check if we're in development mode with HTTPS
        const isDevelopment = import.meta.env.DEV;
        const isHttps = window.location.protocol === 'https:';
        
        // In development with HTTPS, skip service worker registration to avoid SSL issues
        if (isDevelopment && isHttps) {
          console.log('Skipping Service Worker registration in HTTPS development mode to avoid SSL certificate issues');
          return;
        }
        
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', this.registration);

        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });

        // Handle service worker controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed');
          window.location.reload();
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        // Don't throw the error, just log it to prevent app crashes
      }
    }
  }

  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  private handleOnline(): void {
    console.log('App is online');
    // Trigger background sync for offline actions
    if (this.registration && 'sync' in this.registration) {
      (this.registration as any).sync.register('background-sync');
    }
    
    // Show online notification
    this.showNotification('Connection restored', 'You are back online');
  }

  private handleOffline(): void {
    console.log('App is offline');
    this.showNotification('You are offline', 'Some features may be limited');
  }

  private showUpdateNotification(): void {
    if (this.registration) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center">
          <span class="mr-3">🔄</span>
          <span>New version available</span>
          <button class="ml-4 bg-white text-blue-500 px-3 py-1 rounded text-sm" onclick="window.location.reload()">
            Update
          </button>
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 10000);
    }
  }

  private showNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async storeOfflineAction(action: OfflineAction): Promise<void> {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'STORE_OFFLINE_ACTION',
        action
      });
    }
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    // This would typically be handled by the service worker
    // For now, we'll return an empty array
    return [];
  }

  isAppOnline(): boolean {
    return this.isOnline;
  }

  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }
}

// Request caching strategies
export class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache with automatic key generation
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Background sync manager
export class BackgroundSyncManager {
  private swManager: ServiceWorkerManager;

  constructor(swManager: ServiceWorkerManager) {
    this.swManager = swManager;
  }

  async syncWhenOnline(action: OfflineAction): Promise<void> {
    if (this.swManager.isAppOnline()) {
      // Perform action immediately if online
      await this.performAction(action);
    } else {
      // Store for later sync if offline
      await this.swManager.storeOfflineAction(action);
    }
  }

  private async performAction(action: OfflineAction): Promise<void> {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...action.headers
        },
        body: action.body ? JSON.stringify(action.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Background sync action failed:', error);
      throw error;
    }
  }
}

// Create singleton instances
export const serviceWorkerManager = new ServiceWorkerManager();
export const requestCache = new RequestCache();
export const backgroundSyncManager = new BackgroundSyncManager(serviceWorkerManager);

// Initialize service worker
export async function initializeServiceWorker(): Promise<void> {
  await serviceWorkerManager.register();
}

// Export types
export type { OfflineAction }; 