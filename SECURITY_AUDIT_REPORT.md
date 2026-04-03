# LandlordBot Security Audit Report

**Audit Date:** 2026-04-02  
**Auditor:** Security Audit Bot  
**Location:** C:\Users\grent\.openclaw\workspace\landlord-bot-testing

---

## Executive Summary

This security audit examined the LandlordBot codebase across 7 key areas. **4 High/Critical issues** and **7 Medium/Low issues** were identified. The most critical issues involve dependency vulnerabilities, missing middleware enforcement for AI limits, and potential bot token exposure in RLS policies.

---

## Critical Issues (Immediate Action Required)

### 1. 🔴 CRITICAL: Bot Token Stored in Plain Text in Database
**Severity:** Critical  
**Location:** `supabase/migrations/20260324000000_missing_rls_policies.sql`

**Issue:** The `bot_settings` table stores `bot_token` as plain text without encryption:
```sql
bot_token text,  -- Plain text token storage
```

**Risk:** If database is compromised, attacker gains access to Telegram bot tokens which could be used to impersonate landlords or access tenant conversations.

**Fix:**
```sql
-- Add encryption for bot tokens
ALTER TABLE bot_settings ALTER COLUMN bot_token TYPE bytea;
-- Or use pgcrypto for encryption
ALTER TABLE bot_settings ADD COLUMN bot_token_encrypted text;
```

**Recommendation:** Store tokens encrypted at rest; decrypt only when needed in edge functions.

---

### 2. 🟠 HIGH: Missing Server-Side AI Rate Limit Enforcement
**Severity:** High  
**Location:** `src/services/aiUsage.ts` lines 65-128

**Issue:** AI quota checking is client-side only. Malicious users can bypass limits by:
- Calling Supabase functions directly
- Modifying client-side code
- Using custom scripts

```typescript
// Client-side only enforcement - vulnerable
export async function checkAIQuota(userId: string): AsyncResult<AIQuotaStatus, AppError> {
  // Can be bypassed by calling Supabase directly
}
```

**Risk:** Users can exceed AI limits, causing cost overruns and potential service abuse.

**Fix:** Implement Supabase Edge Function or RPC for server-side enforcement:
```sql
-- Create RPC function that enforces limits
CREATE OR REPLACE FUNCTION increment_ai_usage_secure(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_quota RECORD;
BEGIN
    SELECT * INTO v_quota FROM check_ai_quota_available(p_user_id);
    IF NOT v_quota.can_proceed THEN
        RETURN FALSE;
    END IF;
    -- Increment usage
    INSERT INTO ai_usage (...) VALUES (...) 
    ON CONFLICT (...) DO UPDATE SET requests_used = ai_usage.requests_used + 1;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## High Severity Issues

### 3. 🟠 HIGH: Dependency Vulnerabilities
**Severity:** High  
**Location:** `package.json`

**Vulnerabilities Found:**
- **picomatch**: High severity vulnerability (already noted by maintainer)
- **brace-expansion**: Zero-step sequence causes process hang (moderate severity)
- **nodemailer**: SMTP command injection (< 8.0.4)

**Risk:** DoS attacks, potential code execution, SMTP injection attacks.

**Fix:**
```bash
npm audit fix
npm update picomatch brace-expansion nodemailer
```

**Monitor with:**
```bash
npm audit --audit-level=moderate
```

---

### 4. 🟠 HIGH: CSP Allows 'unsafe-inline' Scripts
**Severity:** High  
**Location:** `index.html` line 7

**Issue:** Current CSP allows inline scripts which defeats XSS protection:
```html
<meta http-equiv="Content-Security-Policy" content="... script-src 'self' 'unsafe-inline' ...">
```

**Risk:** XSS attacks can execute via injected inline scripts.

**Fix:** Generate nonces for inline scripts:
```html
<!-- Add nonce generation at build time -->
<meta http-equiv="Content-Security-Policy" content="... script-src 'self' 'nonce-${NONCE}' ...">
<script nonce="${NONCE}">/* runtime config */</script>
```

---

## Medium Severity Issues

### 5. 🟡 MEDIUM: Rate Limit Store is In-Memory Only
**Severity:** Medium  
**Location:** `src/utils/validation.ts` lines 126-138

**Issue:** Rate limiting uses in-memory JavaScript object that resets on server restart:
```typescript
const rateLimitStore: RateLimitStore = {};
```

**Risk:** Rate limits can be bypassed by:
- Distributing attacks across multiple server instances
- Waiting for server restart

**Fix:** Use Redis or database-backed rate limiting for production.

---

### 6. 🟡 MEDIUM: No Input Length Validation on AI Prompts
**Severity:** Medium  
**Location:** `src/services/aiGuardrails.ts`

**Issue:** No maximum length check on user questions before processing:
```typescript
export function isLegalQuestion(question: string): boolean {
  // No length validation
  const normalizedQuestion = question.toLowerCase();
  // ...
}
```

**Risk:** Potential DoS via extremely large prompts; increased API costs.

**Fix:** Add length limits:
```typescript
const MAX_PROMPT_LENGTH = 4000;
export function isLegalQuestion(question: string): boolean | { error: string } {
  if (question.length > MAX_PROMPT_LENGTH) {
    return { error: 'Question too long. Please limit to 4000 characters.' };
  }
  // ...
}
```

---

### 7. 🟡 MEDIUM: Subscription Tier Enum Mismatch
**Severity:** Medium  
**Location:** `src/services/aiUsage.ts` vs `supabase/migrations/20250314000000_subscription_schema.sql`

**Issue:** JavaScript uses tier names `free/pro/concierge` but database uses `free/starter/pro/enterprise`:
```typescript
// TypeScript
export const TIER_AI_LIMITS = {
  free: 50,
  pro: 500,
  concierge: Infinity
};

-- SQL
CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'))
```

**Risk:** Data integrity issues; limits may not be applied correctly.

**Fix:** Align tier names across frontend and database.

---

### 8. 🟡 MEDIUM: Email Content Allows Limited HTML Injection
**Severity:** Medium  
**Location:** `src/services/sendgrid.ts`

**Issue:** Email templates accept user input but only sanitize via `sanitizeText()`:
```typescript
const sanitizedTenantName = sanitizeText(tenantName);
```

**Risk:** While DOMPurify is used, email HTML context has different risks than browser DOM.

**Fix:** Use email-specific sanitization library like `sanitize-html` with email-safe config.

---

## Low Severity Issues

### 9. 🟢 LOW: Missing Rate Limit on Magic Link Resend
**Severity:** Low  
**Location:** `src/features/auth/components/LoginForm.tsx`

**Issue:** No explicit rate limiting on magic link resends beyond the auth rate limiter check.

**Fix:** Add specific magic link rate limiting in the rate limiter.

---

### 10. 🟢 LOW: build.sourcemap Set to false Without Sentry Config
**Severity:** Low  
**Location:** `vite.config.ts` line 38

**Issue:** Source maps disabled but Sentry integration in place - will make debugging harder.

**Fix:** Either enable sourcemaps or ensure Sentry release artifacts are uploaded with sourcemaps.

---

### 11. 🟢 LOW: Auth LocalStorage Keys Still Referenced
**Severity:** Low  
**Location:** `src/features/auth/services/authService.ts` lines 14-15

**Issue:** Constants defined but not actually used (good), but should be removed entirely:
```typescript
export const AUTH_STORAGE_KEY = 'landlordbot_auth';  // Unused
export const AUTH_TIMESTAMP_KEY = 'landlordbot_auth_timestamp';  // Unused
```

---

## Postive Security Findings ✅

### 1. Strong Auth Token Security
**Location:** `src/lib/supabase.ts`

**Good:** Tokens stored memory-only with `persistSession: false` - excellent XSS protection:
```typescript
auth: {
  autoRefreshToken: true,
  persistSession: false,       // SECURITY: Don't store tokens in localStorage
  detectSessionInUrl: true,
}
```

### 2. Comprehensive RLS Policies
**Good:** All tables have appropriate RLS policies enforcing user data isolation.

### 3. XSS Prevention via DOMPurify
**Good:** Multiple layers of XSS protection:
- `sanitizeInput()` removes all HTML tags
- `sanitizeRichText()` allows only safe formatting tags
- No attributes allowed to prevent event handlers

### 4. Legal Guardrails Implemented
**Good:** Comprehensive legal keyword detection and safe response templates protect against providing unauthorized legal advice.

### 5. No Hardcoded Secrets Found
**Good:** No API keys, passwords, or credentials found in source code - all use environment variables.

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Encrypt bot tokens | Medium | Critical |
| P0 | Server-side AI rate limiting | Medium | High |
| P1 | Fix dependency vulnerabilities | Low | High |
| P1 | CSP unsafe-inline fix | High | High |
| P2 | Distributed rate limiting | Medium | Medium |
| P2 | Input length validation | Low | Medium |
| P3 | Email sanitization | Low | Low |
| P3 | Sourcemap configuration | Low | Low |

---

## Files Reviewed

- ✅ `src/services/aiGuardrails.ts` - Legal keyword blocklist, safe templates
- ✅ `src/services/aiUsage.ts` - Tier-based limits
- ✅ `src/services/sendgrid.ts` - Email service
- ✅ `src/features/auth/services/authService.ts` - Auth token handling
- ✅ `src/features/auth/hooks/useAuth.tsx` - Auth state management
- ✅ `src/lib/supabase.ts` - Supabase client configuration
- ✅ `src/lib/sanitize.ts` - Input sanitization
- ✅ `src/utils/validation.ts` - Rate limiting
- ✅ `index.html` - CSP headers
- ✅ `vite.config.ts` - Build configuration
- ✅ `supabase/migrations/*.sql` - RLS policies (9 migrations reviewed)
- ✅ `.env.example` - Environment template
- ✅ `package.json` - Dependencies

---

## Conclusion

The LandlordBot codebase shows **strong security foundations** with proper XSS prevention, memory-only token storage, and comprehensive RLS policies. However, **Critical and High severity issues require immediate attention**, particularly:

1. **Bot token encryption** (Critical)
2. **Server-side rate limit enforcement** (High)
3. **Dependency updates** (High)

With these fixes implemented, the application will have enterprise-grade security appropriate for handling sensitive landlord-tenant data.

---

*Report generated by OpenClaw Security Audit Bot*
