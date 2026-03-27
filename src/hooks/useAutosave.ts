import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

// Prefix for sessionStorage keys
const AUTOSAVE_KEY_PREFIX = 'lb_autosave_';

export interface AutosaveState<T> {
  data: T | null;
  timestamp: number;
  key: string;
  version: number;
}

const CURRENT_VERSION = 1;

/**
 * Hook for auto-saving and restoring form data
 * Uses sessionStorage (persists per tab, cleared when tab closes)
 * Provides automatic save on unmount and restore on mount
 */
export function useAutosave<T extends Record<string, unknown>>({
  key,
  data,
  onRestore,
  enabled = true,
  debounceMs = 1000,
}: {
  key: string;
  data: T;
  onRestore?: (restoredData: T) => void;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const { showInfo, showSuccess } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);
  const storageKey = `${AUTOSAVE_KEY_PREFIX}${key}`;

  // Save data to sessionStorage
  const saveToStorage = useCallback((dataToSave: T) => {
    if (!enabled) return;
    
    try {
      const state: AutosaveState<T> = {
        data: dataToSave,
        timestamp: Date.now(),
        key,
        version: CURRENT_VERSION,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn(`[useAutosave] Failed to save to sessionStorage:`, e);
    }
  }, [enabled, storageKey, key]);

  // Restore data from sessionStorage
  const restoreFromStorage = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return null;

      const state = JSON.parse(saved) as AutosaveState<T>;
      
      // Version check
      if (state.version !== CURRENT_VERSION) {
        sessionStorage.removeItem(storageKey);
        return null;
      }

      // Validate key matches
      if (state.key !== key) {
        sessionStorage.removeItem(storageKey);
        return null;
      }

      return state.data;
    } catch (e) {
      console.warn(`[useAutosave] Failed to restore from sessionStorage:`, e);
      return null;
    }
  }, [storageKey, key]);

  // Clear saved data
  const clearAutosave = useCallback((showNotification = false) => {
    try {
      sessionStorage.removeItem(storageKey);
      hasRestoredRef.current = false;
      if (showNotification) {
        showSuccess('Draft cleared');
      }
    } catch (e) {
      console.warn(`[useAutosave] Failed to clear sessionStorage:`, e);
    }
  }, [storageKey, showSuccess]);

  // Check if autosave exists
  const hasAutosave = useCallback((): boolean => {
    return sessionStorage.getItem(storageKey) !== null;
  }, [storageKey]);

  // Get autosave metadata
  const getAutosaveInfo = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return null;
      
      const state = JSON.parse(saved) as AutosaveState<T>;
      return {
        timestamp: state.timestamp,
        age: Date.now() - state.timestamp,
      };
    } catch {
      return null;
    }
  }, [storageKey]);

  // Manual save trigger
  const saveNow = useCallback(() => {
    saveToStorage(data);
  }, [saveToStorage, data]);

  // Restore effect - runs once on mount
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return;
    
    const restored = restoreFromStorage();
    if (restored) {
      hasRestoredRef.current = true;
      const info = getAutosaveInfo();
      const ageMinutes = info ? Math.floor(info.age / 60000) : 0;
      
      // Only restore if less than 24 hours old
      if (info && info.age < 24 * 60 * 60 * 1000) {
        onRestore?.(restored);
        showInfo(
          ageMinutes < 1 
            ? 'Draft restored from this tab' 
            : `Draft restored from ${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago`
        );
      } else {
        // Clear old drafts
        clearAutosave();
      }
    }
  }, [enabled, key]); // Only re-run if key changes

  // Auto-save effect with debounce
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounced save
    debounceTimerRef.current = setTimeout(() => {
      // Only save if data has meaningful content
      const hasContent = Object.values(data).some(v => {
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return v !== 0;
        if (typeof v === 'boolean') return true;
        if (Array.isArray(v)) return v.length > 0;
        if (v && typeof v === 'object') return Object.keys(v).length > 0;
        return false;
      });

      if (hasContent) {
        saveToStorage(data);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, saveToStorage]);

  // Save on unmount/visibility hidden (page close/reload)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save immediately when tab becomes hidden
        saveToStorage(data);
      }
    };

    const handleBeforeUnload = () => {
      saveToStorage(data);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final save on unmount
      saveToStorage(data);
    };
  }, [enabled, data, saveToStorage]);

  return {
    clearAutosave,
    hasAutosave,
    getAutosaveInfo,
    saveNow,
    restored: hasRestoredRef.current,
  };
}

/**
 * Helper to clear all autosaved data for a specific entity type
 * Useful when logging out
 */
export function clearAllAutosaves(entityPrefix?: string) {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(AUTOSAVE_KEY_PREFIX)) {
        if (!entityPrefix || key.includes(entityPrefix)) {
          sessionStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    console.warn('[useAutosave] Failed to clear autosaves:', e);
  }
}

export default useAutosave;
