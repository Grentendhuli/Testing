# OAuth "Stuck on Callback" Diagnostic Checklist

> **Symptom:** User stuck on "Completing sign in..." page after authenticating with Google

---

## Supabase Dashboard Configuration Check

### 1. URL Configuration (Authentication → URL Configuration)

Navigate to **Authentication → URL Configuration** in your Supabase dashboard:

| Setting | Required Value |
|---------|--------------|
| **Site URL** | `https://landlord-bot-testing.vercel.app` |
| **Redirect URLs** | Must include: `https://landlord-bot-testing.vercel.app/auth/callback` |

**What to check:**
- [ ] Site URL matches exactly (no trailing slash)
- [ ] Redirect URL is listed in the allowed URLs
- [ ] No http/https mismatch between environments

---

### 2. Google Auth Provider Configuration (Authentication → Providers → Google)

Navigate to **Authentication → Providers → Google**:

**Supabase Settings:**
- [ ] **Status:** Must be **Enabled**
- [ ] **Client ID:** Must be set (from Google Cloud Console)
- [ ] **Client Secret:** Must be set (from Google Cloud Console)

**Google Cloud Console Settings:**
- Navigate to `console.cloud.google.com` → APIs & Services → Credentials
- [ ] Authorized **JavaScript origin** includes: `https://landlord-bot-testing.vercel.app`
- [ ] Authorized **redirect URI** includes: `https://landlord-bot-testing.vercel.app/auth/callback`
- [ ] Both Supabase and Google Console redirect URLs match exactly

---

### 3. Common Errors to Check in Browser Console

Open browser developer tools (F12) → Console tab:

| Error Message | Meaning | Likely Cause |
|--------------|---------|--------------|
| `"Invalid code"` | Authorization code exchange failed | Redirect URL mismatch between Google Console and Supabase |
| `"Code verifier not found"` | PKCE challenge missing | LocalStorage cleared or session lost between redirect |
| `"Provider not enabled"` | Google OAuth not configured | Google Auth disabled in Supabase or missing credentials |
| `"Invalid redirect URL"` | URL not in allow list | Callback URL missing from URL Configuration |
| `"No session"` | Authentication failed | Session cookie issue or CORS misconfiguration |

---

### 4. Fix Steps

#### How to Verify Redirect URLs

1. **Check Supabase:**
   ```
   Dashboard → Authentication → URL Configuration
   ```
   Ensure these redirect URLs are listed:
   - `https://landlord-bot-testing.vercel.app/auth/callback`

2. **Check Google Cloud Console:**
   ```
   console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client
   ```
   Authorized redirect URIs must include:
   - `https://landlord-bot-testing.vercel.app/auth/callback`

3. **Compare URLs:**
   - Must match character-for-character
   - Watch for trailing slashes (`/callback` vs `/callback/`)
   - Watch for protocol mismatches (`http` vs `https`)

#### How to Re-initiate OAuth Flow

1. **Close the stuck tab completely**
2. **Navigate directly to:** `https://landlord-bot-testing.vercel.app`
3. **Click "Sign in with Google" button again**
4. **Watch browser console** for redirect/callback errors

#### How to Clear Storage and Retry

**Option A: Browser Dev Tools**
1. Press `F12` → Application tab
2. Local Storage → `https://landlord-bot-testing.vercel.app`
3. Right-click → "Clear"
4. Cookies → Clear for this domain
5. Refresh and retry login

**Option B: Incognito Mode**
1. Close all incognito windows
2. Open new incognito/private window
3. Navigate to app
4. Attempt sign-in (no cached state)

**Option C: Hard Refresh**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## Quick Diagnostic Flow

```
☐ Open browser console (F12) BEFORE clicking login
☐ Check for JavaScript errors on landing page
☐ Click "Sign in with Google"
☐ Watch console during redirect
☐ If stuck: Check console for specific error message
☐ Match error to Common Errors table above
☐ Apply fix and retry
```

---

## Most Common Root Causes

1. **Redirect URL mismatch** (80% of cases)
   - Google Console redirect URI ≠ Supabase callback URL
   
2. **Missing redirect URL in Supabase**
   - `/auth/callback` not added to allowed URLs

3. **PKCE session loss**
   - Code verifier cleared from localStorage before callback completes

4. **Google Auth not enabled**
   - Provider disabled in Supabase dashboard
