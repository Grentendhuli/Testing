# Secure Auth Token Storage

## Overview

This document explains the security implementation for auth token storage to prevent XSS (Cross-Site Scripting) attacks.

## The Problem

**Previous State (Vulnerable):**
- Auth tokens stored in `localStorage` via `persistSession: true`
- Malicious scripts could steal tokens via `localStorage.getItem('sb-auth-token')`
- XSS vulnerability: injected scripts have access to all localStorage data

## The Solution

**Current State (Secure):**
- Auth tokens stored **in memory only** via `persistSession: false`
- Tokens are never written to localStorage, cookies, or any persistent storage
- XSS attacks cannot steal tokens (they don't exist in DOM-accessible storage)

## Implementation Details

### File: `src/lib/supabase.ts`

```typescript
supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,      // Auto-refresh while tab is open
    persistSession: false,       // SECURITY: Memory-only (XSS protection)
    detectSessionInUrl: true,    // Handle OAuth redirects
  },
});
```

### File: `src/features/auth/hooks/useAuth.tsx`

- Removed cross-tab sync logic (was designed for localStorage)
- User data cache remains (non-sensitive, safe to store)
- Auth state is now single-tab only

## Trade-offs

| Aspect | Before (localStorage) | After (Memory-only) |
|--------|----------------------|---------------------|
| **XSS Risk** | ❌ High - tokens stealable | ✅ None - tokens not accessible |
| **Session Persistence** | ✅ Survives tab close/refresh | ❌ Lost on refresh/close |
| **User Experience** | Login once, stays logged in | Must re-login after closing tab |
| **Multi-Tab Support** | ✅ Synced across tabs | ❌ Each tab independent |
| **Performance** | No refresh calls | Occasional token refresh |

## Session Behavior

### When Token Persists (Logged In)
- While tab is open and active
- During navigation within the app (React Router)
- When using `autoRefreshToken: true` (extends session automatically)

### When Token Lost (Requires Re-login)
- Page refresh (F5, Ctrl+R)
- Closing the browser tab
- Closing the browser entirely
- Opening the app in a new tab

## OAuth Provider Support

**Still Works:**
- Google Sign-In
- Apple Sign-In
- Microsoft Sign-In
- Magic Links

**How it works:**
- OAuth providers redirect back with token in URL hash
- `detectSessionInUrl: true` captures and processes the token
- Token is stored in memory, not localStorage

## Recommended Session Configuration

Configure in Supabase Dashboard:
- Go to **Authentication > Sessions**
- Set **Access Token Lifetime** to **1 hour** (3600 seconds)
- Enable **Automatic Token Refresh**
- This ensures tokens don't live too long in memory

## Security Benefits

1. **XSS Protection**: Malicious scripts cannot access tokens
2. **Reduced Attack Surface**: No sensitive data in localStorage
3. **Automatic Cleanup**: Tokens gone when tab closes
4. **Shorter Exposure Window**: 1-hour TTL vs 1-week default

## UX Considerations

While less convenient, this is industry-standard security practice used by:
- Banking applications
- Healthcare portals
- High-security enterprise apps

For lower-security use cases, a "Remember Me" feature could be added (cookie-based with httpOnly flag), but this requires backend support.

## Testing Checklist

- [ ] Login works normally
- [ ] Refresh token extends session
- [ ] OAuth (Google/Apple) sign-in works
- [ ] After refresh, user must re-login
- [ ] New tab requires re-login
- [ ] localStorage contains NO `sb-*` auth keys
- [ ] User data cache (`lb_user_data_cache_v3`) still works

## Future Enhancements (Optional)

1. **Remember Me Cookie**: Secure, httpOnly cookie for optional persistence
2. **Biometric Auth**: WebAuthn for re-login without password
3. **Refresh Token Rotation**: Backend-controlled token lifecycle
