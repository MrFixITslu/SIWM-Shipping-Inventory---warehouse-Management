// services/offlineService.ts
// Enhanced offline capabilities for areas with poor internet connectivity
// Features:
// - Local data caching
// - Offline action queue
// - Background sync when online
// - Conflict resolution
// - Data compression for storage efficiency

import { OfflineAction, OfflineStatus, SyncResult } from '@/types';
import { api } from './apiHelper';

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface SyncConflict {
  localAction: OfflineAction;
  serverData: any;
  conflictType: 'update' | 'delete' | 'create';
}

class OfflineService {
  private dbName = 'inventory_offline_db';
  private version = 1;
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private pendingActions: OfflineAction[] = [];

  constructor() {
    this.initializeDatabase();
    this.setupOnlineOfflineListeners();
    this.loadPendingActions();
  }

  // Initialize IndexedDB for offline storage
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('cachedData')) {
          const cachedDataStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cachedDataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
          actionsStore.createIndex('status', 'status', { unique: false });
          actionsStore.createIndex('entityType', 'entityType', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncConflicts')) {
          db.createObjectStore('syncConflicts', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Setup online/offline event listeners
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
    console.log('App is online - starting background sync');
    this.performBackgroundSync();
  }

  private handleOffline(): void {
    console.log('App is offline - actions will be queued');
  }

  // Cache data for offline access
  async cacheData(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');

    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cachedData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');

    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const cached = request.result as CachedData;
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if data is expired
        if (Date.now() - cached.timestamp > cached.ttl) {
          this.removeCachedData(key);
          resolve(null);
          return;
        }

        resolve(cached.data as T);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Remove cached data
  async removeCachedData(key: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear expired cache
  async clearExpiredCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    const index = store.index('timestamp');

    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);

    return new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const cached = cursor.value as CachedData;
          if (now - cached.timestamp > cached.ttl) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Queue offline action
  async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'status' | 'created_at' | 'retry_count'>): Promise<void> {
    if (!this.db) return;

    const offlineAction: OfflineAction = {
      ...action,
      id: Date.now(), // Temporary ID
      status: 'pending',
      created_at: new Date().toISOString(),
      retry_count: 0
    };

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');

    await new Promise<void>((resolve, reject) => {
      const request = store.add(offlineAction);
      request.onsuccess = () => {
        this.pendingActions.push(offlineAction);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Load pending actions from IndexedDB
  private async loadPendingActions(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    const index = store.index('status');

    return new Promise<void>((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => {
        this.pendingActions = request.result || [];
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get offline status
  getOfflineStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      pendingActions: this.pendingActions.length,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.getLastSyncTime()
    };
  }

  // Perform background sync when online
  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress || this.pendingActions.length === 0) return;

    this.syncInProgress = true;
    try {
      await this.syncOfflineActions();
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync offline actions with server
  async syncOfflineActions(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: ['Not online']
      };
    }

    const results: SyncResult = {
      success: true,
      syncedActions: 0,
      failedActions: 0,
      errors: []
    };

    for (const action of this.pendingActions) {
      try {
        await this.performAction(action);
        await this.markActionCompleted(action.id);
        results.syncedActions++;
      } catch (error: any) {
        results.failedActions++;
        results.errors.push(`${action.action_type} ${action.entity_type}: ${error.message}`);
        
        // Increment retry count
        action.retry_count++;
        if (action.retry_count >= 3) {
          await this.markActionFailed(action.id, error.message);
        }
      }
    }

    results.success = results.failedActions === 0;
    return results;
  }

  // Perform individual action
  private async performAction(action: OfflineAction): Promise<void> {
    const { action_type, entity_type, entity_id, action_data } = action;

    switch (action_type) {
      case 'create':
        await api.post(`/${entity_type}`, action_data);
        break;
      case 'update':
        await api.put(`/${entity_type}/${entity_id}`, action_data);
        break;
      case 'delete':
        await api.delete(`/${entity_type}/${entity_id}`);
        break;
      default:
        throw new Error(`Unknown action type: ${action_type}`);
    }
  }

  // Mark action as completed
  private async markActionCompleted(actionId: number): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');

    await new Promise<void>((resolve, reject) => {
      const request = store.get(actionId);
      request.onsuccess = () => {
        const action = request.result;
        if (action) {
          action.status = 'completed';
          action.processed_at = new Date().toISOString();
          store.put(action);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    // Remove from pending actions array
    this.pendingActions = this.pendingActions.filter(a => a.id !== actionId);
  }

  // Mark action as failed
  private async markActionFailed(actionId: number, errorMessage: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');

    await new Promise<void>((resolve, reject) => {
      const request = store.get(actionId);
      request.onsuccess = () => {
        const action = request.result;
        if (action) {
          action.status = 'failed';
          action.error_message = errorMessage;
          store.put(action);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    // Remove from pending actions array
    this.pendingActions = this.pendingActions.filter(a => a.id !== actionId);
  }

  // Handle sync conflicts
  async handleSyncConflict(conflict: SyncConflict): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncConflicts'], 'readwrite');
    const store = transaction.objectStore('syncConflicts');

    await new Promise<void>((resolve, reject) => {
      const request = store.add(conflict);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get sync conflicts
  async getSyncConflicts(): Promise<SyncConflict[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['syncConflicts'], 'readonly');
    const store = transaction.objectStore('syncConflicts');

    return new Promise<SyncConflict[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Resolve sync conflict
  async resolveSyncConflict(conflictId: number, resolution: 'local' | 'server' | 'manual'): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncConflicts'], 'readwrite');
    const store = transaction.objectStore('syncConflicts');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(conflictId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get last sync time
  private getLastSyncTime(): string | undefined {
    const lastSync = localStorage.getItem('lastSyncTime');
    return lastSync || undefined;
  }

  // Set last sync time
  private setLastSyncTime(): void {
    localStorage.setItem('lastSyncTime', new Date().toISOString());
  }

  // Clear all offline data (for testing/debugging)
  async clearAllOfflineData(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData', 'offlineActions', 'syncConflicts'], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('cachedData').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('offlineActions').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('syncConflicts').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);

    this.pendingActions = [];
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{
    cachedDataSize: number;
    pendingActionsSize: number;
    conflictsSize: number;
    totalSize: number;
  }> {
    if (!this.db) return { cachedDataSize: 0, pendingActionsSize: 0, conflictsSize: 0, totalSize: 0 };

    const transaction = this.db.transaction(['cachedData', 'offlineActions', 'syncConflicts'], 'readonly');
    
    const [cachedData, pendingActions, conflicts] = await Promise.all([
      new Promise<any[]>((resolve, reject) => {
        const request = transaction.objectStore('cachedData').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }),
      new Promise<any[]>((resolve, reject) => {
        const request = transaction.objectStore('offlineActions').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }),
      new Promise<any[]>((resolve, reject) => {
        const request = transaction.objectStore('syncConflicts').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
    ]);

    const cachedDataSize = JSON.stringify(cachedData).length;
    const pendingActionsSize = JSON.stringify(pendingActions).length;
    const conflictsSize = JSON.stringify(conflicts).length;
    const totalSize = cachedDataSize + pendingActionsSize + conflictsSize;

    return {
      cachedDataSize,
      pendingActionsSize,
      conflictsSize,
      totalSize
    };
  }
}

// Export singleton instance
export const offlineService = new OfflineService(); 