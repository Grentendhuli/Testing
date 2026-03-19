import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/browser';

// Sentry DSN - Replace with your actual DSN from Sentry dashboard
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// Environment configuration
const ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 
  (import.meta.env.PROD ? 'production' : 'development');

// Initialize Sentry
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: import.meta.env.VITE_APP_VERSION || 'landlordbot@2.2.0',
    
    // Performance monitoring - using browserTracingIntegration
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Sample rates
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Error filtering
    beforeSend(event) {
      // Filter out common browser extension errors
      if (event.exception?.values?.some(ex => {
        const errorMessage = ex.value || '';
        return (
          errorMessage.includes('chrome-extension') ||
          errorMessage.includes('moz-extension') ||
          errorMessage.includes('safari-extension') ||
          errorMessage.includes('webkit-masked-url') ||
          errorMessage.includes('ResizeObserver loop') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('Failed to fetch')
        );
      })) {
        return null;
      }
      
      // Filter out non-error log levels in production
      if (ENVIRONMENT === 'production' && event.level === 'log') {
        return null;
      }
      
      return event;
    },
    
    // Sanitize sensitive data
    beforeBreadcrumb(breadcrumb) {
      // Remove PII from breadcrumbs
      if (breadcrumb.data?.url) {
        try {
          const url = new URL(breadcrumb.data.url);
          // Remove query parameters that might contain sensitive data
          const sensitiveParams = ['token', 'password', 'secret', 'key', 'auth'];
          sensitiveParams.forEach(param => {
            url.searchParams.delete(param);
          });
          breadcrumb.data.url = url.toString();
        } catch {
          // Invalid URL, keep as is
        }
      }
      
      // Remove sensitive data from message
      if (breadcrumb.message) {
        breadcrumb.message = breadcrumb.message.replace(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          '[EMAIL_REDACTED]'
        );
      }
      
      return breadcrumb;
    },
    
    // Additional configuration
    maxBreadcrumbs: 100,
    attachStacktrace: true,
    normalizeDepth: 10,
  });

  console.log(`[Sentry] Initialized in ${ENVIRONMENT} mode`);
}

// User context interface
interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  subscription_tier?: string;
  [key: string]: any;
}

// Set user context for error tracking
export function setUserContext(user: SentryUser | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  // Only set non-PII user data
  Sentry.setUser({
    id: user.id,
    // Hash or anonymize email if needed
    email: user.email ? `${user.id}@user.landlordbot` : undefined,
    username: user.username || user.id,
    subscription_tier: user.subscription_tier,
  });
}

// Add breadcrumb for debugging
export function addBreadcrumb(
  message: string,
  category: string = 'default',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Capture error with context
export function captureError(
  error: Error | string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: SentryUser;
  }
) {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  Sentry.withScope((scope) => {
    // Set tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Set extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    // Set user if provided
    if (context?.user) {
      setUserContext(context.user);
    }
    
    // Capture the error
    Sentry.captureException(errorObj);
  });
}

// Capture message
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.captureMessage(message, level);
}

// Track navigation
export function trackNavigation(from: string, to: string) {
  addBreadcrumb(
    `Navigation: ${from} → ${to}`,
    'navigation',
    'info',
    { from, to }
  );
}

// Track user action
export function trackUserAction(action: string, details?: Record<string, any>) {
  addBreadcrumb(
    `User Action: ${action}`,
    'user.action',
    'info',
    details
  );
}

// Track API call
export function trackApiCall(
  endpoint: string,
  method: string,
  success: boolean,
  duration?: number
) {
  addBreadcrumb(
    `API ${method} ${endpoint} ${success ? 'success' : 'failed'}`,
    'api',
    success ? 'info' : 'error',
    { endpoint, method, success, duration }
  );
}

// Export Sentry for direct access if needed
export { Sentry };
