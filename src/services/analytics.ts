import posthog from 'posthog-js';
import type { User } from '../types';

// Initialize PostHog
const POSTHOG_API_KEY = (import.meta as any).env?.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = (import.meta as any).env?.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let posthogInitialized = false;

export const initPostHog = () => {
  if (posthogInitialized || !POSTHOG_API_KEY) {
    return;
  }

  try {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: false,
      persistence: 'localStorage',
      loaded: (posthog) => {
        if ((import.meta as any).env?.DEV) {
          posthog.debug();
        }
      },
    });

    posthogInitialized = true;
    console.log('📊 PostHog initialized');
  } catch (err) {
    console.error('Failed to initialize PostHog:', err);
  }
};

export const identifyUser = (id: string, properties: {
  email?: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  createdAt?: string;
}) => {
  if (!posthogInitialized || !id) return;

  try {
    posthog.identify(id, {
      email: properties.email,
      firstName: properties.firstName,
      lastName: properties.lastName,
      subscriptionTier: properties.subscriptionTier,
      createdAt: properties.createdAt,
    });
  } catch (err) {
    console.error('Failed to identify user:', err);
  }
};

export const resetUser = () => {
  if (!posthogInitialized) return;
  posthog.reset();
};

// Track events
export const track = {
  // Page views
  pageView: (pageName: string, properties?: Record<string, any>) => {
    if (!posthogInitialized) return;
    posthog.capture('$pageview', {
      page_name: pageName,
      ...properties,
    });
  },

  // User actions
  unitAdded: (properties: { unitId: string; address: string; bedrooms: number; bathrooms: number }) => {
    if (!posthogInitialized) return;
    posthog.capture('unit_added', properties);
  },

  unitUpdated: (properties: { unitId: string; fields: string[] }) => {
    if (!posthogInitialized) return;
    posthog.capture('unit_updated', properties);
  },

  unitDeleted: (properties: { unitId: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('unit_deleted', properties);
  },

  leadCreated: (properties: { leadId: string; source: string; status: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('lead_created', properties);
  },

  leadConverted: (properties: { leadId: string; unitId?: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('lead_converted', properties);
  },

  maintenanceCreated: (properties: { requestId: string; priority: string; category: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('maintenance_created', properties);
  },

  paymentRecorded: (properties: { unitId: string; amount: number; tenantName: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('payment_recorded', properties);
  },

  // Subscription events
  subscriptionViewed: (properties: { currentTier: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('subscription_viewed', properties);
  },

  upgradeClicked: (properties: { fromTier: string; toTier: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('upgrade_clicked', properties);
  },

  checkoutStarted: (properties: { tier: string; priceId: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('checkout_started', properties);
  },

  checkoutSucceeded: (properties: { tier: string; amount: number }) => {
    if (!posthogInitialized) return;
    posthog.capture('checkout_succeeded', properties);
  },

  checkoutFailed: (properties: { tier: string; error: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('checkout_failed', properties);
  },

  // AI events
  aiAssistantUsed: (properties: { query: string; responseLength: number }) => {
    if (!posthogInitialized) return;
    posthog.capture('ai_assistant_used', {
      ...properties,
      query: properties.query?.substring(0, 100), // Truncate for privacy
    });
  },

  aiListingGenerated: (properties: { unitId: string; length: number }) => {
    if (!posthogInitialized) return;
    posthog.capture('ai_listing_generated', properties);
  },

  // Errors
  error: (properties: { error: string; context?: string }) => {
    if (!posthogInitialized) return;
    posthog.capture('error_occurred', properties);
  },

  // Generic
  custom: (eventName: string, properties?: Record<string, any>) => {
    if (!posthogInitialized) return;
    posthog.capture(eventName, properties);
  },
};

// Get feature flag
export const getFeatureFlag = (flagName: string) => {
  if (!posthogInitialized) return false;
  return posthog.isFeatureEnabled(flagName);
};

export default { init: initPostHog, identify: identifyUser, reset: resetUser, track };