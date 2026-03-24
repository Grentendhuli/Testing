/**
 * Offline Queue Utility
 * Queues mutations when offline and syncs when back online
 * Integrates with Service Worker v6 Background Sync API
 */

interface QueueItem {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'offline-mutation-queue';
const MAX_RETRIES = 3;

class OfflineQueue {
  private queue: QueueItem[] = [];
  private listeners: ((queue: QueueItem[]) => void)[] = [];
  private processing = false;

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  // Load queue from localStorage
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];
    } catch {
      this.queue = [];
    }
  }

  // Save queue to localStorage
  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.error('[OfflineQueue] Failed to save:', e);
    }
  }

  // Add insert operation
  async addInsert(table: string, data: Record<string, unknown>, priority: QueueItem['priority'] = 'normal'): Promise<void> {
    const item: QueueItem = {
      id: this.generateId(),
      type: 'insert',
      table,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.queue.push(item);
    this.saveQueue();
    
    // Request background sync if available
    this.requestBackgroundSync();
  }

  // Add update operation
  async addUpdate(
    table: string,
    data: Record<string, unknown>,
    conditions: Record<string, unknown>,
    priority: QueueItem['priority'] = 'normal'
  ): Promise<void> {
    const item: QueueItem = {
      id: this.generateId(),
      type: 'update',
      table,
      data,
      conditions,
      priority,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.queue.push(item);
    this.saveQueue();
    this.requestBackgroundSync();
  }

  // Add delete operation
  async addDelete(table: string, conditions: Record<string, unknown>, priority: QueueItem['priority'] = 'normal'): Promise<void> {
    const item: QueueItem = {
      id: this.generateId(),
      type: 'delete',
      table,
      conditions,
      priority,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.queue.push(item);
    this.saveQueue();
    this.requestBackgroundSync();
  }

  // Get queue stats
  getStats(): { total: number; pending: number; failed: number; byType: Record<string, number> } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.retryCount < MAX_RETRIES).length,
      failed: this.queue.filter(i => i.retryCount >= MAX_RETRIES).length,
      byType: {
        insert: this.queue.filter(i => i.type === 'insert').length,
        update: this.queue.filter(i => i.type === 'update').length,
        delete: this.queue.filter(i => i.type === 'delete').length
      }
    };
  }

  // Get all queue items
  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  // Clear queue
  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  // Subscribe to changes
  onChange(callback: (queue: QueueItem[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.queue));
  }

  // Request background sync
  private async requestBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-mutations');
      } catch (e) {
        // Fallback: polling will handle it
      }
    }
  }

  // Process queue
  async processQueue(supabaseClient: any): Promise<{ success: number; failed: number }> {
    if (this.processing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.processing = true;
    let success = 0;
    let failed = 0;

    // Sort by priority and timestamp
    const sortedQueue = [...this.queue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    for (const item of sortedQueue) {
      if (item.retryCount >= MAX_RETRIES) {
        failed++;
        continue;
      }

      try {
        let result;
        
        switch (item.type) {
          case 'insert':
            result = await supabaseClient.from(item.table).insert(item.data);
            break;
          case 'update':
            result = await supabaseClient.from(item.table).update(item.data).match(item.conditions);
            break;
          case 'delete':
            result = await supabaseClient.from(item.table).delete().match(item.conditions);
            break;
        }

        if (result.error) throw result.error;

        // Remove from queue on success
        this.queue = this.queue.filter(i => i.id !== item.id);
        success++;
      } catch (e) {
        item.retryCount++;
        failed++;
      }
    }

    this.saveQueue();
    this.processing = false;

    return { success, failed };
  }

  // Setup online listener
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('[OfflineQueue] Back online, triggering sync');
      this.requestBackgroundSync();
    });
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

// Hook for React components
export function useOfflineQueue() {
  return {
    queue: offlineQueue.getQueue(),
    stats: offlineQueue.getStats(),
    addInsert: offlineQueue.addInsert.bind(offlineQueue),
    addUpdate: offlineQueue.addUpdate.bind(offlineQueue),
    addDelete: offlineQueue.addDelete.bind(offlineQueue),
    clear: offlineQueue.clear.bind(offlineQueue),
    processQueue: offlineQueue.processQueue.bind(offlineQueue),
    onChange: offlineQueue.onChange.bind(offlineQueue)
  };
}
