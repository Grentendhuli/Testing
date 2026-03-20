/**
 * Google Analytics 4 Tracking Utility for LandlordBot
 * 
 * This module provides type-safe event tracking for user behavior
 * from signup → login → subscription conversion.
 * 
 * Usage:
 *   import { analytics } from '../utils/analytics';
 *   analytics.trackEvent('signup_complete', { method: 'google' });
 */

// GA4 Config
const GA_MEASUREMENT_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
const IS_DEV = (import.meta as any).env?.DEV;
const ANALYTICS_ENABLED = (import.meta as any).env?.VITE_ENABLE_ANALYTICS !== 'false';

// User properties cache to avoid redundant calls
let userPropertiesCache: Record<string, any> = {};

// Analytics Event Types
export type AnalyticsEvent =
  // Page Views
  | 'page_view'
  // Authentication Events
  | 'signup_started'
  | 'signup_complete'
  | 'signup_failed'
  | 'login_started'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'magic_link_sent'
  | 'magic_link_clicked'
  // Subscription Events
  | 'subscription_viewed'
  | 'subscription_checkout_started'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_cancelled'
  | 'upgrade_clicked'
  | 'pricing_plan_selected'
  | 'conversion'
  | 'purchase'
  // Feature Usage Events
  | 'unit_added'
  | 'unit_edited'
  | 'unit_deleted'
  | 'tenant_added'
  | 'payment_recorded'
  | 'payment_reminder_sent'
  | 'lease_created'
  | 'lease_renewed'
  | 'maintenance_request_created'
  | 'maintenance_request_resolved'
  | 'report_generated'
  | 'export_downloaded'
  // AI Feature Events
  | 'ai_chat_started'
  | 'ai_action_executed'
  | 'ai_insight_viewed'
  // Engagement Events
  | 'dashboard_viewed'
  | 'profile_updated'
  | 'settings_changed'
  | 'help_accessed'
  | 'feedback_submitted';

// Event Parameters
export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

// User Properties
export interface UserProperties {
  user_id?: string;
  email?: string;
  subscription_tier?: 'free' | 'concierge';
  subscription_status?: 'active' | 'inactive' | 'trialing';
  unit_count?: number;
  signup_method?: 'google' | 'microsoft' | 'magic_link' | 'email';
  first_visit?: string;
  last_visit?: string;
}

/**
 * Analytics tracking utility
 */
class Analytics {
  private gtag: any;
  private initialized = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize GA4 tracking
   */
  private init(): void {
    if (typeof window === 'undefined') return;
    if (!ANALYTICS_ENABLED) {
      if (IS_DEV) console.log('[Analytics] Disabled via env');
      return;
    }

    // Wait for gtag to be available
    const checkGtag = () => {
      if (window.gtag) {
        this.gtag = window.gtag;
        this.initialized = true;
        if (IS_DEV) console.log('[Analytics] Initialized');
      } else {
        setTimeout(checkGtag, 100);
      }
    };
    checkGtag();
  }

  /**
   * Check if analytics is ready
   */
  isReady(): boolean {
    return this.initialized && !!this.gtag;
  }

  /**
   * Track a page view
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.isReady()) {
      if (IS_DEV) console.log('[Analytics:PageView]', pagePath, pageTitle);
      return;
    }

    this.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: AnalyticsEvent, params?: EventParams): void {
    if (!this.isReady()) {
      if (IS_DEV) console.log('[Analytics:Event]', eventName, params);
      return;
    }

    this.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user properties for better segmentation
   */
  setUserProperties(properties: UserProperties): void {
    // Merge with cache
    userPropertiesCache = { ...userPropertiesCache, ...properties };

    if (!this.isReady()) {
      if (IS_DEV) console.log('[Analytics:UserProperties]', properties);
      return;
    }

    this.gtag('config', GA_MEASUREMENT_ID, {
      user_properties: properties,
    });
  }

  /**
   * Identify a user (call after login/signup)
   */
  identifyUser(userId: string, properties?: Partial<UserProperties>): void {
    if (!this.isReady()) {
      if (IS_DEV) console.log('[Analytics:Identify]', userId, properties);
      return;
    }

    this.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });

    if (properties) {
      this.setUserProperties(properties);
    }
  }

  /**
   * Track conversion funnel step
   */
  trackFunnelStep(
    funnelName: 'signup' | 'subscription' | 'onboarding',
    step: number,
    stepName: string,
    params?: EventParams
  ): void {
    this.trackEvent('funnel_progress' as AnalyticsEvent, {
      funnel_name: funnelName,
      step_number: step,
      step_name: stepName,
      ...params,
    });
  }

  /**
   * Track a conversion event (purchase, subscription, etc.)
   */
  trackConversion(
    conversionType: 'subscription' | 'signup' | 'upgrade',
    params?: EventParams
  ): void {
    this.trackEvent('conversion' as AnalyticsEvent, {
      conversion_type: conversionType,
      ...params,
    });
    
    // Also track as purchase for enhanced ecommerce
    if (conversionType === 'subscription' || conversionType === 'upgrade') {
      this.trackEvent('purchase' as AnalyticsEvent, params);
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

/**
 * React Hook for page view tracking
 * Usage in components:
 *   usePageTracking('/dashboard', 'Dashboard');
 */
export function usePageTracking(pagePath: string, pageTitle?: string): void {
  useEffect(() => {
    analytics.trackPageView(pagePath, pageTitle);
  }, [pagePath, pageTitle]);
}

// Import React for the hook
import { useEffect } from 'react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
