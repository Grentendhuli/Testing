// Google Calendar API Integration for LandlordBot (Browser-compatible version)
// Uses Google Identity Services and REST API instead of googleapis library
// Free tier: 1 million requests/day (effectively unlimited)
// Requires user OAuth consent

// Types for calendar events
export interface MaintenanceEventDetails {
  summary: string;
  description: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  tenantName: string;
  unitNumber: string;
  issue: string;
  priority: string;
  requestId?: string;
}

export interface ShowingEventDetails {
  summary: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  prospectName: string;
  prospectPhone?: string;
  prospectEmail?: string;
  unitNumber: string;
  notes?: string;
}

export interface LeaseRenewalDetails {
  summary: string;
  description: string;
  location?: string;
  tenantName: string;
  unitNumber: string;
  leaseEndDate: string;
  reminderDate: string; // 60 days before lease end
  leaseId?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  colorId?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

// Google Identity Services types
// Note: We use type assertions instead of global declarations to avoid conflicts with @types/google.maps
interface GoogleAccounts {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: Error) => void;
      }) => TokenClient;
    };
  };
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

// Configuration
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = (import.meta as any).env?.VITE_GOOGLE_API_KEY || ''; // Optional, for public data

// Storage keys
const STORAGE_KEY_TOKEN = 'landlordbot_google_token';
const STORAGE_KEY_EXPIRY = 'landlordbot_google_expiry';
const STORAGE_KEY_CONNECTED = 'landlordbot_google_connected';

// Scopes needed for Calendar operations
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

// Token client instance
let tokenClient: TokenClient | null = null;
let currentToken: string | null = null;
let tokenCallback: ((token: string | null) => void) | null = null;

/**
 * Initialize Google Identity Services
 * Call this on app startup
 */
export function initGoogleAuth(): boolean {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Calendar: Missing VITE_GOOGLE_CLIENT_ID');
    return false;
  }

  // Load existing token if available
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
  
  if (savedToken && expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() < expiryTime) {
      currentToken = savedToken;
    } else {
      // Token expired, clear it
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_EXPIRY);
    }
  }

  // Initialize token client if Google Identity Services is loaded
  const googleAccounts = (window as unknown as { google?: GoogleAccounts }).google;
  if (googleAccounts?.accounts?.oauth2) {
    tokenClient = googleAccounts.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          console.error('Google Calendar auth error:', response.error, response.error_description);
          tokenCallback?.(null);
          return;
        }
        
        currentToken = response.access_token;
        const expiryTime = Date.now() + (response.expires_in * 1000);
        
        // Store token
        localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
        localStorage.setItem(STORAGE_KEY_EXPIRY, expiryTime.toString());
        localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
        
        tokenCallback?.(response.access_token);
      },
      error_callback: (error) => {
        console.error('Google Calendar error callback:', error);
        tokenCallback?.(null);
      },
    });
  }

  return true;
}

/**
 * Load Google Identity Services script
 * Call this before using any Google Calendar functions
 */
export function loadGoogleIdentityServices(): Promise<boolean> {
  return new Promise((resolve) => {
    const accounts = (window as unknown as { google?: GoogleAccounts }).google?.accounts;
    if (accounts?.oauth2) {
      resolve(initGoogleAuth());
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(initGoogleAuth());
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Google OAuth
 * Returns a promise that resolves with the access token
 */
export function signInWithGoogle(): Promise<string | null> {
  return new Promise(async (resolve) => {
    // Ensure Google Identity Services is loaded
    const accounts = (window as unknown as { google?: GoogleAccounts }).google?.accounts;
    if (!accounts?.oauth2) {
      const loaded = await loadGoogleIdentityServices();
      if (!loaded) {
        resolve(null);
        return;
      }
    }

    // If we already have a valid token, return it
    if (currentToken) {
      const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
      if (expiry && Date.now() < parseInt(expiry, 10)) {
        resolve(currentToken);
        return;
      }
    }

    // Set up callback and request token
    tokenCallback = resolve;
    tokenClient?.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Check if user is authenticated with Google Calendar
 */
export function isGoogleCalendarConnected(): boolean {
  const connected = localStorage.getItem(STORAGE_KEY_CONNECTED) === 'true';
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
  
  if (!connected || !token || !expiry) return false;
  
  // Check if token is still valid
  return Date.now() < parseInt(expiry, 10);
}

/**
 * Disconnect Google Calendar
 * Removes all stored tokens
 */
export function disconnectGoogleCalendar(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRY);
  localStorage.removeItem(STORAGE_KEY_CONNECTED);
  currentToken = null;
  
  // Revoke token if possible
  const accounts = (window as unknown as { google?: GoogleAccounts }).google?.accounts;
  if (currentToken && accounts?.oauth2) {
    // Note: GIS doesn't have a direct revoke method, but we can clear our stored token
    currentToken = null;
  }
}

/**
 * Get valid access token
 * Refreshes if needed
 */
async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
  
  if (!token || !expiry) return null;
  
  // Check if token is expired or about to expire (within 5 minutes)
  if (Date.now() > parseInt(expiry, 10) - 5 * 60 * 1000) {
    // Token expired, need to re-authenticate
    return signInWithGoogle();
  }
  
  return token;
}

/**
 * Make authenticated request to Google Calendar API
 */
async function makeCalendarRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) {
    console.error('Google Calendar: Not authenticated');
    return null;
  }

  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it
        disconnectGoogleCalendar();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return null;
  }
}

/**
 * Create a maintenance event in Google Calendar
 */
export async function createMaintenanceEvent(
  eventDetails: MaintenanceEventDetails
): Promise<CalendarEvent | null> {
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    location: eventDetails.location,
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
    colorId: '11', // Red for maintenance
    extendedProperties: {
      private: {
        type: 'maintenance',
        tenantName: eventDetails.tenantName,
        unitNumber: eventDetails.unitNumber,
        issue: eventDetails.issue,
        priority: eventDetails.priority,
        requestId: eventDetails.requestId || '',
        app: 'LandlordBot',
      },
    },
  };

  return makeCalendarRequest<CalendarEvent>('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/**
 * Create a property showing event in Google Calendar
 */
export async function createShowingEvent(
  eventDetails: ShowingEventDetails
): Promise<CalendarEvent | null> {
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    location: eventDetails.location,
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 120 },
        { method: 'popup', minutes: 60 },
      ],
    },
    colorId: '2', // Green for showings
    extendedProperties: {
      private: {
        type: 'showing',
        prospectName: eventDetails.prospectName,
        prospectPhone: eventDetails.prospectPhone || '',
        prospectEmail: eventDetails.prospectEmail || '',
        unitNumber: eventDetails.unitNumber,
        notes: eventDetails.notes || '',
        app: 'LandlordBot',
      },
    },
  };

  return makeCalendarRequest<CalendarEvent>('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/**
 * Create a lease renewal reminder event
 * Creates an all-day event 60 days before lease end
 */
export async function createLeaseRenewalReminder(
  leaseDetails: LeaseRenewalDetails
): Promise<CalendarEvent | null> {
  const event = {
    summary: leaseDetails.summary,
    description: leaseDetails.description,
    location: leaseDetails.location,
    start: {
      date: leaseDetails.reminderDate,
    },
    end: {
      date: leaseDetails.reminderDate,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 },
      ],
    },
    colorId: '5', // Yellow for reminders
    extendedProperties: {
      private: {
        type: 'lease_renewal',
        tenantName: leaseDetails.tenantName,
        unitNumber: leaseDetails.unitNumber,
        leaseEndDate: leaseDetails.leaseEndDate,
        leaseId: leaseDetails.leaseId || '',
        app: 'LandlordBot',
      },
    },
  };

  return makeCalendarRequest<CalendarEvent>('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/**
 * Get upcoming events from Google Calendar
 * @param calendarId - Calendar ID (default: 'primary')
 * @param maxResults - Maximum number of events to return (default: 10)
 * @param daysAhead - Number of days to look ahead (default: 30)
 */
export async function getUpcomingEvents(
  calendarId: string = 'primary',
  maxResults: number = 10,
  daysAhead: number = 30
): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  const timeMax = future.toISOString();

  const params = new URLSearchParams({
    timeMin: now,
    timeMax: timeMax,
    maxResults: maxResults.toString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const result = await makeCalendarRequest<{ items?: CalendarEvent[] }>(
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  );

  return result?.items || [];
}

/**
 * Get LandlordBot-specific events (filtered by extended properties)
 */
export async function getLandlordBotEvents(
  maxResults: number = 50,
  daysAhead: number = 90
): Promise<CalendarEvent[]> {
  const events = await getUpcomingEvents('primary', maxResults, daysAhead);
  
  // Filter events that have LandlordBot extended properties
  return events.filter(event => {
    const isLandlordBotEvent = event.extendedProperties?.private?.app === 'LandlordBot';
    const description = event.description || '';
    return isLandlordBotEvent || 
           description.includes('LandlordBot') || 
           description.includes('Unit:') ||
           description.includes('Tenant:');
  });
}

/**
 * Delete an event from Google Calendar
 * @param eventId - The event ID to delete
 * @param calendarId - Calendar ID (default: 'primary')
 */
export async function deleteEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  const result = await makeCalendarRequest<void>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' }
  );
  
  // DELETE returns empty body on success
  return result !== undefined || true;
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<CalendarEvent | null> {
  // First get the existing event
  const existing = await makeCalendarRequest<CalendarEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  );
  
  if (!existing) return null;

  // Merge updates
  const updatedEvent = { ...existing, ...updates };

  return makeCalendarRequest<CalendarEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(updatedEvent),
    }
  );
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent | null> {
  return makeCalendarRequest<CalendarEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  );
}

/**
 * Handle OAuth callback (for popup flow)
 * This is called when the OAuth popup returns
 */
export async function handleAuthCallback(code: string): Promise<boolean> {
  // With Google Identity Services, the token is returned directly
  // This function is kept for compatibility with the original API
  return isGoogleCalendarConnected();
}

// Export a service object for convenience
export const GoogleCalendarService = {
  init: initGoogleAuth,
  loadScript: loadGoogleIdentityServices,
  signIn: signInWithGoogle,
  handleCallback: handleAuthCallback,
  isConnected: isGoogleCalendarConnected,
  disconnect: disconnectGoogleCalendar,
  createMaintenanceEvent,
  createShowingEvent,
  createLeaseRenewalReminder,
  getUpcomingEvents,
  getLandlordBotEvents,
  deleteEvent,
  updateEvent,
  getEvent,
};

export default GoogleCalendarService;
