# LandlordBot LIVE - Supabase Connection Fix

## The Problem
The LIVE deployment was using **mock mode** because during build time, Vite couldn't access the environment variables. The code checked:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasCredentials = supabaseUrl && supabaseKey && supabaseUrl.startsWith('http');
```

When `hasCredentials` was false, it used `mockClient` which returns fake auth errors.

## The Permanent Fix

### 1. Update supabase.ts to Fail Loudly (Not Silently)

Instead of falling back to mock mode, the LIVE build should **throw an error** if credentials are missing:

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For LIVE: Fail if credentials missing (don't use mock)
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'LIVE deployment: Supabase credentials required. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel dashboard.'
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
```

### 2. Create Environment Validation Script

Create `scripts/validate-env.js`:

```javascript
// Validate required environment variables before build
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('\nSet these in Vercel dashboard: https://vercel.com/dashboard');
  process.exit(1);
}

console.log('✅ All required environment variables present');
```

### 3. Update package.json Build Script

```json
{
  "scripts": {
    "prebuild": "node scripts/validate-env.js",
    "build": "vite build",
    "vercel-build": "npm run prebuild && npm run build"
  }
}
```

### 4. Vercel Dashboard Configuration

**Never rely on `.env` files for production builds.**

In Vercel Dashboard (https://vercel.com/dashboard):
1. Go to landlord-bot-live project
2. Settings → Environment Variables
3. Add these **Production** variables:
   - `VITE_SUPABASE_URL`: `https://qmnngzevquidtvcopjcu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjY0MDgsImV4cCI6MjA4NzY0MjQwOH0.tVOtTl1C-FxddhspvFUQqO9_lDLCUuv6zs-1VwapoX0`

### 5. Why .env Files Don't Work in Vercel

- Vite's `import.meta.env` only includes **build-time** variables
- `.env` files are **not** automatically uploaded to Vercel
- Variables must be set in the Vercel dashboard to be available during build

### 6. The Current Quick Fix Applied

I already pushed commit `1551340` which:
- Updated `supabase.ts` with a clearer comment
- Added `.env.production` with credentials (temporary fallack)
- Created `set-vercel-env.js` to configure Vercel via API

**Next step:** Run this to ensure Vercel has the vars:
```bash
node landlord-bot-live/set-vercel-env.js
```

### 7. Verification Steps

After the next build completes:
1. Open https://landlord-bot-live.vercel.app/
2. Create test account
3. Should redirect to dashboard automatically
4. Logout and log back in - should work

### 8. Prevent Future Issues

Add to README.md:
```markdown
## Deployment Requirements

Required Vercel Environment Variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

The build will fail if these are not set.
```

## Quick Commands

```bash
# Verify Vercel env vars are set
node landlord-bot-live/set-vercel-env.js

# Force rebuild
vercel --prod --force

# Check current deployment
vercel ls landlord-bot-live
```
