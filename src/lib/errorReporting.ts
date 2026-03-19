import { 
  captureError as sentryCaptureError,
  setUserContext as sentrySetUserContext,
  addBreadcrumb as sentryAddBreadcrumb,
  captureMessage as sentryCaptureMessage,
  trackNavigation as sentryTrackNavigation,
  trackUserAction as sentryTrackUserAction,
  trackApiCall as sentryTrackApiCall,
  Sentry
} from './sentry';

// Re-export all error reporting functions with simpler names
export {
  sentryCaptureError as captureError,
  sentrySetUserContext as setUserContext,
  sentryAddBreadcrumb as addBreadcrumb,
  sentryCaptureMessage as captureMessage,
  sentryTrackNavigation as trackNavigation,
  sentryTrackUserAction as trackUserAction,
  sentryTrackApiCall as trackApiCall,
  Sentry
};

// Convenience function for manual error reporting with automatic context
export function reportError(
  error: Error | string,
  componentName?: string,
  additionalContext?: Record<string, any>
) {
  const context: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  } = {
    tags: {},
    extra: {},
  };
  
  if (componentName) {
    context.tags!.component = componentName;
  }
  
  if (additionalContext) {
    context.extra = additionalContext;
  }
  
  // Add timestamp
  context.extra!.reportedAt = new Date().toISOString();
  context.extra!.userAgent = navigator.userAgent;
  context.extra!.url = window.location.href;
  
  sentryCaptureError(error, context);
}

// Log levels for different severity
export function logInfo(message: string, data?: Record<string, any>) {
  console.info('[Info]', message, data);
  sentryAddBreadcrumb(message, 'info', 'info', data);
}

export function logWarning(message: string, data?: Record<string, any>) {
  console.warn('[Warning]', message, data);
  sentryAddBreadcrumb(message, 'warning', 'warning', data);
}

export function logError(message: string, error?: Error, data?: Record<string, any>) {
  console.error('[Error]', message, error, data);
  
  if (error) {
    reportError(error, undefined, { message, ...data });
  } else {
    sentryCaptureMessage(message, 'error');
  }
}

// Set tag for current scope
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

// Set extra context for current scope
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value);
}

// Flush events to Sentry (useful before page unload)
export function flushSentry(timeout?: number): Promise<boolean> {
  return Sentry.flush(timeout);
}

// Close Sentry client
export function closeSentry(): Promise<boolean> {
  return Sentry.close();
}

// Test function to verify Sentry is working
export function testSentryIntegration(): boolean {
  const testError = new Error('Test error - Sentry integration verified');
  
  sentryCaptureError(testError, {
    tags: {
      test: 'true',
      component: 'SentryTest',
    },
    extra: {
      testMessage: 'This is a test error to verify Sentry integration',
      timestamp: new Date().toISOString(),
    },
  });
  
  console.log('[Sentry] Test error sent. Check your Sentry dashboard.');
  return true;
}
