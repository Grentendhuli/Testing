/**
 * Offline Queue System v2
 * Integrates with Service Worker v6 for persistent mutation queueing
 * Uses Background Sync API when available, falls back to local polling
 */

import { supabase } from '../lib/supabase';

export interface OfflineQueueItem {
  id: string;
  type: 'insert' | 'update' | 'delete' | 'custom';
  table?: string;
  data?: any;
  conditions?: Record<string, any>;
  endpoint?: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries?: number;
  priority?: 'high' | 'normal' | 'low';
  status?: 'pending' | 'syncing' | 'failed' | 'completed';
}

export interface QueueStats {
  total: number;
  pending: number;
  syncing: number;
  failed: number;
  completed: number;
  byType: Record<string, number>;
}

type QueueChangeHandler = (items: OfflineQueueItem[]) => void;
type SyncCompleteHandler = (results: SyncResult[]) => void;
type ConnectionChangeHandler = (isOnline: boolean) => void;

interface SyncResult {
  itemId: string;
  success: boolean;
  error?: string;
  data?: any;
}

interface ServiceWorkerRegistrationExtended extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

/**
 * Offline Queue Manager v2
 * Enhanced integration with Service Worker v6
 */
class OfflineQueueManager {
  private queue: OfflineQueueItem[] = [];
  private handlers: QueueChangeHandler[] = [];
  private syncHandlers: SyncCompleteHandler[] = [];
  private connectionHandlers: ConnectionChangeHandler[] = [];
  private isProcessing = false;
  private storageKey = 'landlordbot_offline_queue_v2';
  private maxRetries = 3;
  private maxQueueSize = 1000;
  private swRegistration: ServiceWorkerRegistrationExtended | null = null;
  private syncSupported = false;

  constructor() {
    this.loadFromStorage();
    
    if (typeof window !== 'undefined') {
      // Listen for online events and trigger sync
      window.addEventListener('online', () => {
        this.notifyConnectionChange(true);
        this.requestBackgroundSync();
        this.processQueue();
      });
      
      window.addEventListener('offline', () => {
        this.notifyConnectionChange(false);
      });
      
      // Get SW registration for background sync
      this.initServiceWorker();
      
      // Listen for messages from SW
      navigator.serviceWorker?.addEventListener('message', (event) => {
        this.handleSWMessage(event.data);
      });
    }
  }

  private async initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      this.swRegistration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationExtended;
      this.syncSupported = this.swRegistration && 'sync' in this.swRegistration;
      
      console.log('[OfflineQueue] SW ready, sync supported:', this.syncSupported);
    } catch (e) {
      console.warn('[OfflineQueue] Failed to get SW registration:', e);
    }
  }

  private handleSWMessage(data: any) {
    switch (data.type) {
      case 'QUEUE_SYNCED':
        console.log('[OfflineQueue] SW synced queue:', data.processed, 'processed,', data.failed, 'failed');
        this.loadFromStorage(); // Refresh from storage
        this.notifyHandlers();
        break;
        
      case 'QUEUE_ADDED':
        this.loadFromStorage(); // Refresh from storage
        this.notifyHandlers();
        break;
        
      case 'SW_ACTIVATED':
        console.log('[OfflineQueue] SW activated version:', data.version);
        break;
    }
  }

  private notifyConnectionChange(isOnline: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(isOnline);
      } catch (e) {
        console.error('[OfflineQueue] Connection handler error:', e);
      }
    });
  }

  /**
   * Request background sync via Service Worker
   * Fall back to immediate processing if not supported
   */
  private async requestBackgroundSync() {
    if (this.syncSupported && this.swRegistration?.sync) {
      try {
        await this.swRegistration.sync.register('sync-mutations');
        console.log('[OfflineQueue] Background sync registered');
      } catch (e) {
        console.warn('[OfflineQueue] Background sync failed, using fallback:', e);
        this.processQueue();
      }
    } else {
      // Fallback: process immediately
      this.processQueue();
    }
  }

  // Load queue from localStorage (kept in sync with SW IndexedDB)
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[OfflineQueue] Failed to load from storage:', e);
      this.queue = [];
    }
  }

  // Save queue to localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (e) {
      // If quota exceeded, remove old items
      if ((e as any).name === 'QuotaExceededError') {
        this.queue = this.queue.slice(-500);
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        } catch (e2) {
          console.error('[OfflineQueue] Still failed after trimming:', e2);
        }
      }
    }
  }

  private notifyHandlers(): void {
    this.handlers.forEach(handler => {
      try {
        handler([...this.queue]);
      } catch (e) {
        console.error('[OfflineQueue] Handler error:', e);
      }
    });
  }

  /**
   * Add a Supabase insert operation to the queue
   */
  async addInsert(table: string, data: any, options?: { priority?: 'high' | 'normal' | 'low' }): Promise<string> {
    const item: OfflineQueueItem = {
      id: this.generateId(),
      type: 'insert',
      table,
      data,
      method: 'POST',
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      priority: options?.priority || 'normal',
      status: 'pending'
    };

    return this.addItem(item);
  }

  /**
   * Add a Supabase update operation to the queue
   */
  async addUpdate(
    table: string, 
    data: any, 
    conditions: Record<string, any>,
    options?: { priority?: 'high' | 'normal' | 'low' }
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: this.generateId(),
      type: 'update',
      table,
      data,
      conditions,
      method: 'PATCH',
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      priority: options?.priority || 'normal',
      status: 'pending'
    };

    return this.addItem(item);
  }

  /**
   * Add a Supabase delete operation to the queue
   */
  async addDelete(
    table: string, 
    conditions: Record<string, any>,
    options?: { priority?: 'high' | 'normal' | 'low' }
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: this.generateId(),
      type: 'delete',
      table,
      conditions,
      method: 'DELETE',
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      priority: options?.priority || 'normal',
      status: 'pending'
    };

    return this.addItem(item);
  }

  /**
   * Add a custom API request to the queue
   */
  async addCustomRequest(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: any,
    headers?: Record<string, string>,
    options?: { priority?: 'high' | 'normal' | 'low' }
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: this.generateId(),
      type: 'custom',
      endpoint,
      method,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      priority: options?.priority || 'normal',
      status: 'pending'
    };

    return this.addItem(item);
  }

  /**
   * Add item to queue with priority handling
   */
  private addItem(item: OfflineQueueItem): string {
    // Check queue size limit
    if (this.queue.length >= this.maxQueueSize) {
      const lowPriorityIndex = this.queue.findIndex(i => i.priority === 'low');
      if (lowPriorityIndex >= 0) {
        this.queue.splice(lowPriorityIndex, 1);
      } else {
        throw new Error('Queue is full. Please sync before adding more items.');
      }
    }

    // Insert based on priority
    if (item.priority === 'high') {
      this.queue.unshift(item);
    } else if (item.priority === 'low') {
      this.queue.push(item);
    } else {
      const firstLowIndex = this.queue.findIndex(i => i.priority === 'low');
      if (firstLowIndex >= 0) {
        this.queue.splice(firstLowIndex, 0, item);
      } else {
        this.queue.push(item);
      }
    }

    this.saveToStorage();
    this.notifyHandlers();
    
    console.log('[OfflineQueue] Added item', item.id, 'Queue size:', this.queue.length);
    
    // Try to sync if online
    if (navigator.onLine && !this.isProcessing) {
      this.requestBackgroundSync();
    }

    return item.id;
  }

  /**
   * Remove item from queue
   */
  removeItem(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
      this.saveToStorage();
      this.notifyHandlers();
      return true;
    }
    return false;
  }

  /**
   * Get all queue items
   */
  getQueue(): OfflineQueueItem[] {
    return [...this.queue];
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const byType: Record<string, number> = {};
    
    this.queue.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending' || !i.status).length,
      syncing: this.queue.filter(i => i.status === 'syncing').length,
      failed: this.queue.filter(i => i.retryCount >= (i.maxRetries || this.maxRetries)).length,
      completed: this.queue.filter(i => i.status === 'completed').length,
      byType
    };
  }

  /**
   * Clear entire queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyHandlers();
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * Register change handler
   */
  onChange(handler: QueueChangeHandler): () => void {
    this.handlers.push(handler);
    // Immediately call with current state
    handler([...this.queue]);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index >= 0) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Register sync complete handler
   */
  onSyncComplete(handler: SyncCompleteHandler): () => void {
    this.syncHandlers.push(handler);
    return () => {
      const index = this.syncHandlers.indexOf(handler);
      if (index >= 0) {
        this.syncHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register connection change handler
   */
  onConnectionChange(handler: ConnectionChangeHandler): () => void {
    this.connectionHandlers.push(handler);
    // Immediately call with current state
    handler(navigator.onLine);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index >= 0) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Process the offline queue
   */
  async processQueue(): Promise<SyncResult[]> {
    if (this.isProcessing) return [];
    if (!navigator.onLine) {
      console.log('[OfflineQueue] Cannot process - offline');
      return [];
    }
    if (this.queue.length === 0) return [];

    this.isProcessing = true;
    const results: SyncResult[] = [];
    const processed: string[] = [];

    console.log('[OfflineQueue] Processing', this.queue.length, 'items');

    try {
      // Mark items as syncing
      this.queue.forEach(item => {
        if (!item.status || item.status === 'pending') {
          item.status = 'syncing';
        }
      });
      this.notifyHandlers();

      for (const item of [...this.queue]) {
        // Skip items that have exceeded max retries
        if (item.retryCount >= (item.maxRetries || this.maxRetries)) {
          results.push({
            itemId: item.id,
            success: false,
            error: 'Max retries exceeded'
          });
          processed.push(item.id);
          continue;
        }

        try {
          const result = await this.processItem(item);
          item.status = 'completed';
          results.push({
            itemId: item.id,
            success: true,
            data: result
          });
          processed.push(item.id);
        } catch (error) {
          item.retryCount++;
          item.status = 'pending';
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (item.retryCount >= (item.maxRetries || this.maxRetries)) {
            results.push({
              itemId: item.id,
              success: false,
              error: errorMessage
            });
            processed.push(item.id);
          } else {
            results.push({
              itemId: item.id,
              success: false,
              error: errorMessage
            });
          }
        }
      }

      // Remove processed items from queue
      this.queue = this.queue.filter(item => !processed.includes(item.id));
      this.saveToStorage();
      this.notifyHandlers();

      // Notify handlers
      this.syncHandlers.forEach(handler => {
        try {
          handler(results);
        } catch (e) {
          console.error('[OfflineQueue] Sync handler error:', e);
        }
      });

      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      console.log(`[OfflineQueue] Sync complete: ${succeeded} succeeded, ${failed} failed`);

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: OfflineQueueItem): Promise<any> {
    switch (item.type) {
      case 'insert':
        if (!item.table) throw new Error('Table name required');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: insertData, error: insertError } = await (supabase
          .from(item.table) as any)
          .insert(item.data)
          .select();
        if (insertError) throw insertError;
        return insertData;

      case 'update':
        if (!item.table) throw new Error('Table name required');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase.from(item.table) as any).update(item.data);
        if (item.conditions) {
          Object.entries(item.conditions).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        const { data: updateData, error: updateError } = await query.select();
        if (updateError) throw updateError;
        return updateData;

      case 'delete':
        if (!item.table) throw new Error('Table name required');
        let deleteQuery = supabase.from(item.table).delete();
        if (item.conditions) {
          Object.entries(item.conditions).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value);
          });
        }
        const { data: deleteData, error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
        return deleteData;

      case 'custom':
        if (!item.endpoint) throw new Error('Endpoint required');
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...item.headers
          },
          body: item.data ? JSON.stringify(item.data) : undefined
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();

      default:
        throw new Error(`Unknown operation type: ${item.type}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if there are failed items
   */
  hasFailedItems(): boolean {
    return this.queue.some(item => 
      item.retryCount >= (item.maxRetries || this.maxRetries)
    );
  }

  /**
   * Retry failed items
   */
  retryFailed(): void {
    this.queue.forEach(item => {
      if (item.retryCount >= (item.maxRetries || this.maxRetries)) {
        item.retryCount = 0;
        item.status = 'pending';
      }
    });
    this.saveToStorage();
    this.notifyHandlers();
    this.requestBackgroundSync();
  }

  /**
   * Force sync by communicating with Service Worker
   */
  async forceSyncWithSW(): Promise<{ processed: number; failed: number }> {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      // No SW, process locally
      await this.processQueue();
      return { processed: 0, failed: 0 };
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          resolve({
            processed: event.data.processed || 0,
            failed: event.data.failed || 0
          });
        }
      };

      // Give SW 10 seconds to respond
      setTimeout(() => {
        resolve({ processed: 0, failed: 0 });
      }, 10000);

      controller.postMessage(
        { type: 'SYNC_NOW' },
        [channel.port2]
      );
    });
  }

  /**
   * Get cache status from Service Worker
   */
  async getCacheStatus(): Promise<any> {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      return { error: 'Service Worker not active' };
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      setTimeout(() => {
        resolve({ error: 'Timeout' });
      }, 5000);

      controller.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      );
    });
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();

/**
 * React hook pattern for using offline queue
 */
export function useOfflineQueue() {
  return {
    queue: offlineQueue,
    addInsert: offlineQueue.addInsert.bind(offlineQueue),
    addUpdate: offlineQueue.addUpdate.bind(offlineQueue),
    addDelete: offlineQueue.addDelete.bind(offlineQueue),
    processQueue: offlineQueue.processQueue.bind(offlineQueue),
    clear: offlineQueue.clear.bind(offlineQueue),
    getStats: offlineQueue.getStats.bind(offlineQueue),
    onChange: offlineQueue.onChange.bind(offlineQueue),
    onSyncComplete: offlineQueue.onSyncComplete.bind(offlineQueue),
    onConnectionChange: offlineQueue.onConnectionChange.bind(offlineQueue),
  };
}

/**
 * Helper function to wrap Supabase mutations with offline support
 * Automatically queues mutations when offline
 */
export async function withOfflineSupport<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  fallback: { type: 'insert' | 'update' | 'delete'; table: string; data?: any; conditions?: any }
): Promise<{ data: T | null; error: any; queued?: boolean }> {
  // Try the operation first
  if (navigator.onLine) {
    try {
      const result = await operation();
      if (!result.error) {
        return result;
      }
      // If there's an error, fall through to queue it
    } catch (e) {
      // Network error, fall through to queue
    }
  }

  // Queue the operation
  try {
    const itemId = await (async () => {
      switch (fallback.type) {
        case 'insert':
          return await offlineQueue.addInsert(fallback.table, fallback.data);
        case 'update':
          return await offlineQueue.addUpdate(fallback.table, fallback.data, fallback.conditions || {});
        case 'delete':
          return await offlineQueue.addDelete(fallback.table, fallback.conditions || {});
        default:
          throw new Error('Invalid fallback type');
      }
    })();

    return {
      data: null,
      error: null,
      queued: true
    };
  } catch (queueError) {
    return {
      data: null,
      error: queueError,
      queued: false
    };
  }
}

export default offlineQueue;
