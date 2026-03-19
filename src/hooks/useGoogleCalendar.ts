import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleCalendarService,
  CalendarEvent,
  isGoogleCalendarConnected,
  initGoogleAuth,
  signInWithGoogle,
  getLandlordBotEvents,
  deleteEvent,
  disconnectGoogleCalendar,
} from '../services/googleCalendar';

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  upcomingEvents: CalendarEvent[];
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshEvents: () => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<boolean>;
}

// Storage key for caching events
const EVENTS_CACHE_KEY = 'landlordbot_calendar_events';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedEvents {
  events: CalendarEvent[];
  timestamp: number;
}

/**
 * React hook for Google Calendar integration
 * Handles auth state, caching, and calendar operations
 */
export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  
  // Use refs to prevent duplicate initialization
  const initialized = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);

  /**
   * Initialize Google Calendar on mount
   */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initialize auth client
    initGoogleAuth();
    
    // Check connection status
    const connected = isGoogleCalendarConnected();
    setIsConnected(connected);

    // Load cached events if available
    if (connected) {
      loadCachedEvents();
    }
  }, []);

  /**
   * Load events from cache
   */
  const loadCachedEvents = useCallback(() => {
    try {
      const cached = localStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        const parsed: CachedEvents = JSON.parse(cached);
        const now = Date.now();
        
        // Use cache if not expired
        if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
          setUpcomingEvents(parsed.events);
        }
      }
    } catch (err) {
      console.error('Failed to load cached events:', err);
    }
  }, []);

  /**
   * Save events to cache
   */
  const cacheEvents = useCallback((events: CalendarEvent[]) => {
    try {
      const cache: CachedEvents = {
        events,
        timestamp: Date.now(),
      };
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error('Failed to cache events:', err);
    }
  }, []);

  /**
   * Clear events cache
   */
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(EVENTS_CACHE_KEY);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  /**
   * Connect to Google Calendar
   * Opens OAuth popup or redirects to Google consent screen
   */
  const connect = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const authUrl = await signInWithGoogle();
      
      if (authUrl) {
        // Open OAuth in popup window
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          authUrl,
          'google-oauth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );

        if (!popup) {
          // Popup blocked, redirect instead
          window.location.href = authUrl;
          return;
        }

        // Poll for popup closure
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            loadingRef.current = false;
            setIsLoading(false);
            
            // Check if connection was successful
            const connected = isGoogleCalendarConnected();
            setIsConnected(connected);
            
            if (connected) {
              refreshEvents();
            }
          }
        }, 500);
      } else {
        setError('Failed to generate authentication URL');
        loadingRef.current = false;
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to connect to Google Calendar:', err);
      setError('Failed to connect. Please try again.');
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  /**
   * Disconnect from Google Calendar
   */
  const disconnect = useCallback(() => {
    disconnectGoogleCalendar();
    setIsConnected(false);
    setUpcomingEvents([]);
    clearCache();
  }, [clearCache]);

  /**
   * Refresh events from Google Calendar
   */
  const refreshEvents = useCallback(async () => {
    if (!isGoogleCalendarConnected()) {
      setIsConnected(false);
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const events = await getLandlordBotEvents(50, 90);
      setUpcomingEvents(events);
      cacheEvents(events);
    } catch (err) {
      console.error('Failed to refresh events:', err);
      setError('Failed to load events. Please try again.');
      
      // If auth error, mark as disconnected
      if (err instanceof Error && err.message.includes('auth')) {
        setIsConnected(false);
        disconnectGoogleCalendar();
      }
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [cacheEvents]);

  /**
   * Delete a calendar event
   */
  const deleteCalendarEvent = useCallback(async (eventId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const success = await deleteEvent(eventId);
      
      if (success) {
        // Remove from local state
        setUpcomingEvents(prev => prev.filter(e => e.id !== eventId));
        
        // Update cache
        const cached = localStorage.getItem(EVENTS_CACHE_KEY);
        if (cached) {
          const parsed: CachedEvents = JSON.parse(cached);
          parsed.events = parsed.events.filter(e => e.id !== eventId);
          localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(parsed));
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh events when connected
  useEffect(() => {
    if (isConnected && upcomingEvents.length === 0) {
      refreshEvents();
    }
  }, [isConnected, upcomingEvents.length, refreshEvents]);

  // Periodic refresh (every 5 minutes when connected)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refreshEvents();
    }, CACHE_EXPIRY_MS);

    return () => clearInterval(interval);
  }, [isConnected, refreshEvents]);

  return {
    isConnected,
    isLoading,
    error,
    upcomingEvents,
    connect,
    disconnect,
    refreshEvents,
    deleteCalendarEvent,
  };
}

/**
 * Hook for checking Google Calendar connection status only
 * Lightweight version for components that just need to know if connected
 */
export function useGoogleCalendarStatus(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState<boolean>(() => 
    isGoogleCalendarConnected()
  );

  useEffect(() => {
    // Check status periodically
    const interval = setInterval(() => {
      setIsConnected(isGoogleCalendarConnected());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected };
}

/**
 * Hook for scheduling maintenance events
 */
export function useMaintenanceCalendar() {
  const { isConnected } = useGoogleCalendar();
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  const scheduleMaintenance = useCallback(async (details: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    tenantName: string;
    unitNumber: string;
    issue: string;
    priority: string;
    location?: string;
  }): Promise<CalendarEvent | null> => {
    if (!isConnected) {
      console.error('Google Calendar not connected');
      return null;
    }

    setIsScheduling(true);
    
    try {
      const event = await GoogleCalendarService.createMaintenanceEvent({
        ...details,
        summary: details.summary || `Maintenance: ${details.issue}`,
      });
      
      return event;
    } catch (err) {
      console.error('Failed to schedule maintenance:', err);
      return null;
    } finally {
      setIsScheduling(false);
    }
  }, [isConnected]);

  return { isConnected, isScheduling, scheduleMaintenance };
}

/**
 * Hook for scheduling showing events
 */
export function useShowingCalendar() {
  const { isConnected } = useGoogleCalendar();
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  const scheduleShowing = useCallback(async (details: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    prospectName: string;
    prospectPhone?: string;
    prospectEmail?: string;
    unitNumber: string;
    location: string;
    notes?: string;
  }): Promise<CalendarEvent | null> => {
    if (!isConnected) {
      console.error('Google Calendar not connected');
      return null;
    }

    setIsScheduling(true);
    
    try {
      const event = await GoogleCalendarService.createShowingEvent({
        ...details,
        summary: details.summary || `Showing: Unit ${details.unitNumber}`,
      });
      
      return event;
    } catch (err) {
      console.error('Failed to schedule showing:', err);
      return null;
    } finally {
      setIsScheduling(false);
    }
  }, [isConnected]);

  return { isConnected, isScheduling, scheduleShowing };
}

/**
 * Hook for lease renewal reminders
 */
export function useLeaseRenewalCalendar() {
  const { isConnected } = useGoogleCalendar();
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const createRenewalReminder = useCallback(async (details: {
    tenantName: string;
    unitNumber: string;
    leaseEndDate: string;
    location?: string;
    leaseId?: string;
  }): Promise<CalendarEvent | null> => {
    if (!isConnected) {
      console.error('Google Calendar not connected');
      return null;
    }

    setIsCreating(true);
    
    try {
      // Calculate reminder date (60 days before lease end)
      const leaseEnd = new Date(details.leaseEndDate);
      const reminderDate = new Date(leaseEnd);
      reminderDate.setDate(reminderDate.getDate() - 60);
      
      // Format as YYYY-MM-DD for all-day event
      const reminderDateStr = reminderDate.toISOString().split('T')[0];
      
      const event = await GoogleCalendarService.createLeaseRenewalReminder({
        summary: `Lease Renewal Reminder: ${details.tenantName} - Unit ${details.unitNumber}`,
        description: `Lease for ${details.tenantName} in Unit ${details.unitNumber} ends on ${new Date(details.leaseEndDate).toLocaleDateString()}.\n\nNYC Good Cause Eviction requires 60-90 day notice for renewals.\n\nTenant: ${details.tenantName}\nUnit: ${details.unitNumber}\nLease End: ${new Date(details.leaseEndDate).toLocaleDateString()}`,
        location: details.location,
        tenantName: details.tenantName,
        unitNumber: details.unitNumber,
        leaseEndDate: details.leaseEndDate,
        reminderDate: reminderDateStr,
        leaseId: details.leaseId,
      });
      
      return event;
    } catch (err) {
      console.error('Failed to create renewal reminder:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [isConnected]);

  return { isConnected, isCreating, createRenewalReminder };
}

export default useGoogleCalendar;
