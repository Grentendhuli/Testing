# OAuth Implementation Plan - Google & Apple (iCloud)

## Overview
Add OAuth authentication providers to LandlordBot for easier sign-up/login.

## Supported Providers
- ✅ Google OAuth 2.0
- ✅ Apple Sign-In (iCloud)
- ✅ Both work with existing Supabase Auth

---

## Step 1: Supabase Dashboard Configuration

### Google OAuth (5 minutes)
1. Go to https://console.cloud.google.com/
2. Create new project or use existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://qmnngzevquidtvcopjcu.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret

### Apple Sign-In (10 minutes)
1. Go to https://developer.apple.com/
2. Sign in with Apple Developer account
3. Certificates, Identifiers & Profiles → Identifiers
4. Register new identifier (Services ID)
5. Enable "Sign in with Apple"
6. Configure domains:
   - Primary: `landlord-bot-live.vercel.app`
   - Return URLs: `https://qmnngzevquidtvcopjcu.supabase.co/auth/v1/callback`
7. Create private key for Sign in with Apple
8. Copy Services ID and private key

---

## Step 2: Configure Supabase Auth Providers

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google:
   - Paste Client ID
   - Paste Client Secret
   - Save
3. Enable Apple:
   - Paste Services ID
   - Paste private key
   - Set Team ID
   - Save

---

## Step 3: Update AuthContext.tsx

```typescript
// Add to AuthContextType interface
signInWithGoogle: () => Promise<void>;
signInWithApple: () => Promise<void>;

// Add functions in AuthProvider
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
};

const signInWithApple = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
};
```

---

## Step 4: Create OAuth Callback Page

Create `src/pages/AuthCallback.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth callback
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
```

---

## Step 5: Add OAuth Buttons to Login Page

Update login form with OAuth buttons:

```typescript
<button
  onClick={() => signInWithGoogle()}
  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <img src="/google-icon.svg" className="w-5 h-5 mr-2" />
  Continue with Google
</button>

<button
  onClick={() => signInWithApple()}
  className="flex items-center justify-center w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
>
  <AppleIcon className="w-5 h-5 mr-2" />
  Continue with Apple
</button>

<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-300"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
  </div>
</div>
```

---

## Step 6: Update Routes

Add callback route to App.tsx:

```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
```

---

## Step 7: Environment Variables

Add to Vercel:
- `VITE_GOOGLE_CLIENT_ID` (optional, if using custom Google OAuth)
- No additional env vars needed for basic Supabase OAuth

---

## Implementation Time Estimate

- Supabase config: 15 minutes
- Code changes: 30 minutes  
- Testing: 15 minutes
- **Total: ~1 hour**

---

## Benefits

✅ Faster onboarding (one-click login)
✅ No password to remember
✅ Better security (OAuth tokens)
✅ Professional appearance
✅ Higher conversion rates

---

## User Flow

1. Click "Continue with Google/Apple"
2. Redirect to provider
3. User authenticates
4. Redirect back to /auth/callback
5. Supabase captures session
6. Redirect to dashboard
7. Auto-create user record in database
