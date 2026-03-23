import { useState, useEffect, useCallback, useRef } from 'react';

interface PersistenceConfig {
  key: string;
  ttl?: number; // Time to live in ms (default: 7 days)
  encrypt?: boolean; // Whether to encrypt (default: false, add crypto if needed)
}

interface PersistedState<T> {
  data: T | null;
  timestamp: number;
  version: number;
}

const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const STORAGE_VERSION = 1;

/**
 * Bulletproof data persistence hook
 * - Caches data to localStorage with versioning
 * - Handles storage quotas gracefully
 * - Provides optimistic updates
 * - Fallbacks for private browsing
 * 
 * Usage:
 * const [data, setData] = usePersistedState('units', [], { ttl: 86400000 });
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  config: Partial<PersistenceConfig> = {}
) {
  const { ttl = DEFAULT_TTL } = config;
  const storageKey = `lb_persist_${key}_v${STORAGE_VERSION}`;
  const mountRef = useRef(false);

  // Initialize state from localStorage if available
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        const parsed: PersistedState<T> = JSON.parse(item);
        
        // Check if data is still valid
        if (Date.now() - parsed.timestamp < ttl) {
          return parsed.data ?? initialValue;
        }
        // Expired, will be overwritten on next save
      }
    } catch (error) {
      console.warn(`[usePersistedState] Failed to load ${key} from localStorage:`, error);
    }
    
    return initialValue;
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const toStore: PersistedState<T> = {
        data: state,
        timestamp: Date.now(),
        version: STORAGE_VERSION,
      };
      
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (error) {
      // Handle quota exceeded or other errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn(`[usePersistedState] Storage quota exceeded for ${key}, clearing old entries...`);
        // Clear expired entries
        clearExpiredEntries();
        
        // Try again
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            data: state,
            timestamp: Date.now(),
            version: STORAGE_VERSION,
          }));
        } catch {
          // Still failed, continue without persistence
        }
      }
    }
  }, [state, storageKey, ttl]);

  // Mark as hydrated after mount
  useEffect(() => {
    mountRef.current = true;
    setIsHydrated(true);
    
    return () => {
      mountRef.current = false;
    };
  }, []);

  // Clear expired entries from localStorage
  const clearExpiredEntries = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('lb_persist_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp && (now - parsed.timestamp > DEFAULT_TTL)) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  // Clear this specific entry
  const clear = useCallback(() => {
    setState(initialValue);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [initialValue, storageKey]);

  // Update with timestamp
  const updateWithTimestamp = useCallback((newState: T | ((prev: T) => T)) => {
    setState(newState);
  }, []);

  return [state, updateWithTimestamp, { isHydrated, clear }] as const;
}

/**
 * Creates a sync function that keeps local and server data in sync
 * Uses optimistic updates with rollback on failure
 * 
 * Usage:
 * const syncUnits = useSync('units', fetchUnitsFromServer, saveUnitsToServer);
 * 
 * // On update
 * syncUnits.optimisticUpdate(newUnits, async (newData) => {
 *   await saveToServer(newData);
 * });
 */
export function useSync<T>(
  key: string,
  serverFetcher: () => Promise<T>,
  serverSaver?: (data: T) => Promise<unknown>
) {
  const [data, setData, { isHydrated, clear }] = usePersistedState<T | null>(key, null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const previousRef = useRef<T | null>(null);

  // Initial sync from server
  const syncFromServer = useCallback(async (force = false) => {
    // Don't sync if already syncing and not forced
    if (isSyncing && !force) return;
    
    setIsSyncing(true);
    setError(null);
    
    try {
      previousRef.current = data;
      const serverData = await serverFetcher();
      
      // Only update if data changed
      if (JSON.stringify(serverData) !== JSON.stringify(data)) {
        setData(serverData);
        setLastSynced(new Date());
      }
    } catch (err) {
      setError(err as Error);
      // Keep cached data on error
    } finally {
      setIsSyncing(false);
    }
  }, [data, isSyncing, serverFetcher, setData]);

  // Optimistic update with rollback
  const optimisticUpdate = useCallback(async (
    newData: T,
    serverAction: (data: T) => Promise<unknown>,
    onError?: (error: Error) => void
  ) => {
    const previousData = data;
    previousRef.current = previousData;
    
    // Optimistic update
    setData(newData);
    setIsSyncing(true);
    setError(null);
    
    try {
      await serverAction(newData);
      setLastSynced(new Date());
    } catch (err) {
      // Rollback on error
      setData(previousData);
      setError(err as Error);
      onError?.(err as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [data, serverSaver, setData]);

  // Background sync every 5 minutes
  useEffect(() => {
    if (!isHydrated) return;
    
    // Initial sync
    syncFromServer();
    
    // Set up periodic sync
    const intervalId = setInterval(() => {
      syncFromServer();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [isHydrated, syncFromServer]);

  // Sync on window focus (after deployment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromServer(true); // Force sync on focus
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncFromServer]);

  return {
    data,
    setData,
    isHydrated,
    isSyncing,
    lastSynced,
    error,
    syncFromServer,
    optimisticUpdate,
    clear,
    rollback: () => {
      if (previousRef.current !== null) {
        setData(previousRef.current);
      }
    },
  };
}

/**
 * Storage quota management
 * Monitors storage usage and clears old data when needed
 */
export function useStorageQuota() {
  const [usage, setUsage] = useState({ used: 0, total: 0, percentage: 0 });
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const checkQuota = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      return;
    }

    navigator.storage.estimate().then((estimate) => {
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      
      setUsage({ used, total, percentage });
      setIsQuotaExceeded(percentage > 90);
    });
  }, []);

  // Clear old entries to free up space
  const freeSpace = useCallback(() => {
    const keysToRemove: string[] = [];
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('lb_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp && (now - parsed.timestamp > THREE_DAYS)) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    checkQuota();
    
    return keysToRemove.length;
  }, [checkQuota]);

  useEffect(() => {
    checkQuota();
    const intervalId = setInterval(checkQuota, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [checkQuota]);

  return { usage, isQuotaExceeded, freeSpace, checkQuota };
}

export default usePersistedState;