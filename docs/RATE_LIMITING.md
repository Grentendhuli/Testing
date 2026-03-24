# Rate Limiting Implementation

## Overview

This document describes the rate limiting implementation for the LandlordBot application. Rate limiting is implemented at two layers:

1. **Cloudflare Worker (Server-side)** - Primary defense
2. **Frontend Hooks (Client-side)** - Secondary defense and UX feedback

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Request  │────▶│  Cloudflare      │────▶│  Rate Limit     │
│                 │     │  Worker          │     │  Check          │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Allow/Block    │
                                               │  + Headers      │
                                               └─────────────────┘
```

## Server-Side Rate Limiting (Cloudflare Worker)

### Location
- `cloudflare-worker/landlordbot-ai.js`
- `cloudflare-worker/rateLimiter.js`

### Configuration

| Endpoint Type | Requests/Window | Window Size | Purpose |
|--------------|-----------------|-------------|---------|
| AI           | 10              | 60s         | Cost control |
| Auth         | 5               | 300s        | Brute force protection |
| Communication| 20              | 60s         | Email/Vapi calls |
| Export       | 5               | 60s         | Report downloads |
| Default      | 60              | 60s         | General API |

### Features

1. **Per-user rate limiting**: Uses JWT token `sub` claim for user identification
2. **IP-based fallback**: Falls back to `CF-Connecting-IP` header if no JWT
3. **Rate limit headers**:
   - `X-RateLimit-Limit`: Maximum requests allowed
   - `X-RateLimit-Remaining`: Remaining requests in window
   - `X-RateLimit-Reset`: Unix timestamp when limit resets
4. **429 Response**: Returns proper HTTP 429 with retry information

### Usage

The rate limiter is automatically applied to all requests via the `rateLimitMiddleware`:

```javascript
return await rateLimitMiddleware(request, env, corsOrigin, handler);
```

### KV Storage (Optional)

For distributed rate limiting with proper window tracking:

1. Create a KV namespace in Cloudflare Dashboard
2. Uncomment the KV binding in `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "your-kv-namespace-id"
   ```

Without KV, rate limiting is per-request (less effective but functional).

## Client-Side Rate Limiting (Frontend Hooks)

### Location
- `src/hooks/useRateLimiter.ts` - Base rate limiter hook
- `src/hooks/useAuthRateLimiter.ts` - Auth-specific with UI feedback
- `src/hooks/useAIRateLimiter.ts` - AI-specific with cost control

### Base Hook: `useRateLimiter`

```typescript
const rateLimiter = useRateLimiter();

// Check if request is allowed
const status = rateLimiter.checkLimit('ai', userId);

// Check and record in one call
const result = rateLimiter.checkAndRecord('ai', userId);
```

### Auth Hook: `useAuthRateLimiter`

Provides user-friendly messages for auth flows:

```typescript
const authRateLimiter = useAuthRateLimiter();

// In form submission
if (!authRateLimiter.canAttempt('login', email)) {
  const error = authRateLimiter.getErrorMessage('login', email);
  // Show error to user
}

// After failed attempt
authRateLimiter.recordAttempt('login', email);
```

### AI Hook: `useAIRateLimiter`

Cost control with warnings:

```typescript
const aiRateLimiter = useAIRateLimiter();

// Before AI call
if (!aiRateLimiter.canGenerate(userId)) {
  const warning = aiRateLimiter.getWarningMessage(userId);
  // Show warning or block
}

// After AI call
aiRateLimiter.recordGeneration(userId);
```

## Rate Limit Configuration

### Client-Side Limits

```typescript
const RATE_LIMITS = {
  ai: { requestsPerWindow: 10, windowSizeInSeconds: 60 },
  auth: { requestsPerWindow: 5, windowSizeInSeconds: 300 },
  login: { requestsPerWindow: 5, windowSizeInSeconds: 300 },
  signup: { requestsPerWindow: 3, windowSizeInSeconds: 3600 },
  forgotPassword: { requestsPerWindow: 3, windowSizeInSeconds: 3600 },
  email: { requestsPerWindow: 20, windowSizeInSeconds: 60 },
  // ... etc
};
```

## Security Considerations

### Brute Force Protection

- Login endpoints: 5 attempts per 5 minutes (per email)
- Signup endpoints: 3 attempts per hour (per email)
- Uses exponential backoff on failures

### Cost Control

- AI endpoints: 10 requests per minute per user
- Warning shown at 80% usage
- Hard block at 100% usage

### Data Export Protection

- Export endpoints: 5 requests per minute per user
- Prevents data scraping and abuse

## Testing

### Manual Testing

1. **Test rate limiting on login:**
   - Try logging in with wrong password 6 times
   - Verify 6th attempt is blocked
   - Verify timer shows correct retry wait

2. **Test AI rate limiting:**
   - Make 10 AI requests quickly
   - Verify 11th request is blocked
   - Verify rate limit headers in response

3. **Test rate limit reset:**
   - Wait for window to expire
   - Verify requests are allowed again

### Unit Test Template

```typescript
// src/hooks/useRateLimiter.test.ts
describe('useRateLimiter', () => {
  it('should allow requests under limit', () => {
    // Test implementation
  });

  it('should block requests over limit', () => {
    // Test implementation
  });

  it('should reset after window expires', () => {
    // Test implementation
  });
});
```

## Monitoring

Track these events in analytics:

- `login_rate_limited`: When user hits login rate limit
- `signup_rate_limited`: When user hits signup rate limit
- `ai_rate_limited`: When user hits AI rate limit
- Rate limit headers in responses for monitoring dashboards

## Troubleshooting

### User Reported Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Please try again in X minutes" | Rate limited | Wait for window to expire |
| "Too many attempts" | Brute force protection | Wait 5-60 minutes |
| AI requests failing | AI quota exceeded | Wait 24 hours or upgrade |

### Debugging

Check browser console for rate limit headers in response:
```javascript
// In DevTools console
fetch('/api/ai', { method: 'POST' })
  .then(r => console.log({
    limit: r.headers.get('X-RateLimit-Limit'),
    remaining: r.headers.get('X-RateLimit-Remaining'),
    reset: r.headers.get('X-RateLimit-Reset')
  }));
```

## Future Enhancements

1. **Redis backend** for distributed rate limiting
2. **Sliding window** algorithm for smoother limits
3. **User tiered limits** (free vs paid users)
4. **Admin dashboard** for viewing rate limit metrics
5. **Webhook notifications** for repeated abuse
