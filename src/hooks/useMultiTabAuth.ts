import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

// Broadcast channel name for auth events
const BROADCAST_CHANNEL_NAME = 'landlordbot_auth';
const STORAGE_KEY_PREFIX = 'lb_auth_broadcast_';

// Polyfill type for environments without BroadcastChannel
declare global {
  interface Window {
    BroadcastChannel?: typeof BroadcastChannel;
  }
}

export type AuthBroadcastEvent = {
  type: 'LOGOUT' | 'SESSION_EXPIRED' | 'LOGIN';
  timestamp: number;
  sourceTabId: string;
  data?: Record<string, unknown>;
};

// Generate unique tab ID
const generateTabId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Hook for cross-tab authentication synchronization
 * Uses BroadcastChannel API with localStorage fallback for broader browser support
 */
export function useMultiTabAuth({
  onLogout,
  onSessionExpired,
  onLogin,
}: {
  onLogout?: () => void;
  onSessionExpired?: () => void;
  onLogin?: () => void;
}) {
  const tabId = useRef(generateTabId());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastEventTimestamp = useRef<number>(0);
  const { showInfo, showWarning } = useToast();

  // Broadcast an auth event to all tabs
  const broadcastEvent = useCallback((type: AuthBroadcastEvent['type'], data?: Record<string, unknown>) => {
    const event: AuthBroadcastEvent = {
      type,
      timestamp: Date.now(),
      sourceTabId: tabId.current,
      data,
    };

    // Try BroadcastChannel first
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(event);
      } catch (e) {
        console.warn('[useMultiTabAuth] BroadcastChannel postMessage failed:', e);
      }
    }

    // Always backup with localStorage for cross-browser compatibility
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + type, JSON.stringify(event));
      // Remove immediately to prevent storage events on same tab but ensure other tabs see it
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY_PREFIX + type);
      }, 100);
    } catch (e) {
      console.warn('[useMultiTabAuth] localStorage broadcast failed:', e);
    }
  }, []);

  // Broadcast logout to all tabs
  const broadcastLogout = useCallback(() => {
    console.log('[useMultiTabAuth] Broadcasting logout from tab:', tabId.current);
    broadcastEvent('LOGOUT');
  }, [broadcastEvent]);

  // Broadcast session expired to all tabs
  const broadcastSessionExpired = useCallback(() => {
    console.log('[useMultiTabAuth] Broadcasting session expired from tab:', tabId.current);
    broadcastEvent('SESSION_EXPIRED');
  }, [broadcastEvent]);

  // Broadcast login to all tabs
  const broadcastLogin = useCallback(() => {
    console.log('[useMultiTabAuth] Broadcasting login from tab:', tabId.current);
    broadcastEvent('LOGIN');
  }, [broadcastEvent]);

  // Handle incoming auth events
  const handleAuthEvent = useCallback((event: AuthBroadcastEvent) => {
    // Ignore events from the same tab
    if (event.sourceTabId === tabId.current) return;

    // Ignore duplicate/old events (within 1 second window)
    if (event.timestamp <= lastEventTimestamp.current) return;
    lastEventTimestamp.current = event.timestamp;

    console.log('[useMultiTabAuth] Received auth event:', event.type, 'from tab:', event.sourceTabId);

    switch (event.type) {
      case 'LOGOUT':
        showInfo('🔒 You were signed out in another tab');
        onLogout?.();
        break;
      case 'SESSION_EXPIRED':
        showWarning('⏰ Your session has expired');
        onSessionExpired?.();
        break;
      case 'LOGIN':
        showInfo('👋 Signed in on another tab');
        onLogin?.();
        break;
    }
  }, [onLogout, onSessionExpired, onLogin, showInfo, showWarning]);

  // Setup BroadcastChannel and localStorage listeners
  useEffect(() => {
    // Check for BroadcastChannel API support
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current.onmessage = (e) => {
          handleAuthEvent(e.data as AuthBroadcastEvent);
        };
      } catch (e) {
        console.warn('[useMultiTabAuth] BroadcastChannel not available:', e);
      }
    }

    // localStorage fallback (works across all browsers)
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key?.startsWith(STORAGE_KEY_PREFIX)) return;
      if (!e.newValue) return; // Was deleted

      try {
        const event = JSON.parse(e.newValue) as AuthBroadcastEvent;
        handleAuthEvent(event);
      } catch (err) {
        console.warn('[useMultiTabAuth] Failed to parse storage event:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      // Cleanup BroadcastChannel
      if (channelRef.current) {
        try {
          channelRef.current.close();
        } catch (e) {
          // Ignore close errors
        }
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleAuthEvent]);

  return {
    broadcastLogout,
    broadcastSessionExpired,
    broadcastLogin,
    tabId: tabId.current,
  };
}

export default useMultiTabAuth;
