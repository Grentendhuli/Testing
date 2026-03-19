# Sentry Error Tracking Setup

## Overview
Sentry has been integrated into LandlordBot for comprehensive error tracking and monitoring.

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_ENVIRONMENT=development  # or 'production'
VITE_APP_VERSION=landlordbot@2.2.0
```

## Sentry Account Setup

### 1. Create Sentry Account
1. Go to https://sentry.io/signup/
2. Sign up for the free tier (5,000 errors/month)
3. Verify your email address

### 2. Create Project
1. Click "Create Project"
2. Select "React" as the platform
3. Name the project: `LandlordBot`
4. Choose your team
5. Click "Create Project"

### 3. Get DSN
1. In your project settings, go to "Client Keys (DSN)"
2. Copy the DSN URL (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)
3. Add it to your `.env.local` as `VITE_SENTRY_DSN`

### 4. Configure Alerts (Optional)
1. Go to Project Settings → Alerts
2. Create alert rules for critical errors
3. Set up email/Slack notifications

## Features Implemented

### Error Tracking
- Automatic error capture via ErrorBoundary
- Manual error reporting with `captureError()`
- Stack traces with source maps (in production)

### User Context
- Anonymous user tracking (no PII)
- Subscription tier tracking
- Session-based user identification

### Breadcrumbs
- Navigation tracking
- User action logging
- API call monitoring
- Debug breadcrumbs for troubleshooting

### Performance Monitoring
- Browser tracing integration
- Route change tracking
- API call duration tracking

### Privacy Protection
- Email addresses are hashed/anonymized
- Query parameters with sensitive data are stripped
- Browser extension errors are filtered out
- PII is automatically redacted from breadcrumbs

## Usage

### Basic Error Reporting
```typescript
import { captureError } from './lib/errorReporting';

try {
  // Your code
} catch (error) {
  captureError(error, {
    tags: { component: 'MyComponent' },
    extra: { userAction: 'submit_form' }
  });
}
```

### Adding Breadcrumbs
```typescript
import { addBreadcrumb } from './lib/errorReporting';

addBreadcrumb(
  'User clicked submit button',
  'user.action',
  'info',
  { formId: 'contact-form' }
);
```

### Setting User Context
```typescript
import { setUserContext } from './lib/errorReporting';

setUserContext({
  id: user.id,
  subscription_tier: user.subscription_tier,
});
```

### Testing Sentry
```typescript
import { testSentryIntegration } from './lib/errorReporting';

// Call this in development to test
testSentryIntegration();
```

## Error Boundary

The ErrorBoundary component now:
- Catches React errors automatically
- Sends errors to Sentry
- Shows user-friendly error UI
- Provides error reference ID for support
- Includes "Reload", "Go Home", and "Report Issue" buttons

## Free Tier Limits

- **5,000 errors/month** - Sufficient for MVP
- **10,000 performance transactions/month**
- **1GB attachments**
- **30-day data retention**

## Troubleshooting

### Errors not appearing in Sentry
1. Check that `VITE_SENTRY_DSN` is set correctly
2. Verify environment is not set to `development` (errors filtered)
3. Check browser console for Sentry initialization messages
4. Ensure ad blockers aren't blocking Sentry requests

### Source maps not working
1. Upload source maps during build process
2. Configure `release` in Sentry.init()
3. Check Sentry documentation for Vite source map upload

## Security Notes

- Never commit the DSN to version control
- Use environment variables for all Sentry configuration
- The DSN is public (client-side) but treat it as sensitive
- Sentry automatically filters common PII patterns

## Support

For issues with Sentry integration:
1. Check Sentry dashboard: https://sentry.io/issues/
2. Review browser console logs
3. Contact support with error reference ID
