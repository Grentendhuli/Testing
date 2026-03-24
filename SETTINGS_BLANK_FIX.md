# Settings Blank Page Fix Report

## Date: 2026-03-24
## Project: landlord-bot-testing

---

## Problem Summary

The Settings page (`/config`) was rendering as a blank page with console errors showing:
1. **404 errors** for `leases` and `messages` tables
2. **403 RLS errors** for `users` table upsert operations

---

## Root Cause Analysis

### 1. Missing Database Tables
After reviewing all migration files, discovered that two critical tables are **completely missing** from the database schema:
- `leases` table - Stores tenant lease agreements
- `messages` table - Stores tenant-landlord messages

These tables are queried in `AppContext.tsx` → `loadUserData()` function but were never created in any migration file.

### 2. RLS Policy Gap on Users Table
The `users` table RLS policies only allowed SELECT and UPDATE operations, but the Config.tsx page attempts to do UPSERT-style updates for:
- Listing defaults (listing_laundry, listing_pets, etc.)
- Payment handles (venmo_handle, zelle_contact, etc.)

The existing policy:
```sql
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);
```

Was missing the `WITH CHECK` clause which is required for UPSERT operations.

### 3. Error Handling in Config.tsx
While `AppContext.tsx` has graceful handling for missing tables (treats them as empty arrays), the root cause was that the tables didn't exist at all, causing 404 errors that weren't being caught properly.

---

## Fixes Applied

### Fix 1: Created Missing Tables Migration
**File:** `supabase/migrations/20260324000100_create_leases_messages_tables.sql`

Created the `leases` and `messages` tables with:
- Proper columns matching the TypeScript types
- Foreign key constraints to `users` and `units` tables
- Indexes for performance
- RLS policies for data security
- Automatic updated_at triggers

#### Leases Table Schema:
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- unit_id (UUID, FK to units)
- unit_number (TEXT)
- tenant_name (TEXT)
- tenant_email (TEXT)
- tenant_phone (TEXT)
- start_date (DATE)
- end_date (DATE)
- rent_amount (DECIMAL)
- security_deposit (DECIMAL)
- lease_type (TEXT with CHECK constraint)
- status (TEXT with CHECK constraint)
- notes (TEXT)
- created_at / updated_at (TIMESTAMPTZ)
```

#### Messages Table Schema:
```sql
- id (UUID, PK)
- landlord_user_id (UUID, FK to users)
- tenant_phone (TEXT)
- tenant_name (TEXT)
- content (TEXT)
- timestamp (TIMESTAMPTZ)
- direction (TEXT with CHECK constraint)
- status (TEXT with CHECK constraint)
- requires_escalation (BOOLEAN)
- escalation_reason (TEXT)
- ai_response (TEXT)
- landlord_responded (BOOLEAN)
- created_at / updated_at (TIMESTAMPTZ)
```

### Fix 2: Fixed Users Table RLS Policies
**File:** `supabase/migrations/20260324000200_fix_users_rls_policies.sql`

Recreate RLS policies with proper clauses:
- Added `WITH CHECK` to UPDATE policy
- Added INSERT policy for user profile creation
- Added service_role policy for admin operations
- Granted proper permissions to authenticated and anon roles

---

## Verification Steps

To verify the fix:

1. **Run migrations on Supabase:**
   ```bash
   # Option 1: Via Supabase Dashboard SQL Editor
   # Copy contents of migration files and execute
   
   # Option 2: Via CLI
   supabase db push
   ```

2. **Verify tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('leases', 'messages', 'users');
   ```
   Expected: All 3 tables should be listed.

3. **Verify RLS policies:**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'users';
   ```
   Expected: Should see SELECT, UPDATE (with with_check), INSERT, and service_role policies.

4. **Test Settings page:**
   - Open Settings page
   - No console errors should appear
   - All sections should load properly
   - Try saving listing defaults (should work without 403)

---

## Additional Recommendations

### 1. Add Error Boundary to Config.tsx
Consider wrapping the Config component with an error boundary to prevent blank pages on future errors:

```tsx
// In Config.tsx or parent route
<ErrorBoundary fallback={<ConfigError />}>
  <Config />
</ErrorBoundary>
```

### 2. Add Loading State
The current Config.tsx has `if (!botConfig) return null;` which could cause brief blank screens. Consider:

```tsx
if (!botConfig) {
  return <LoadingSpinner message="Loading settings..." />;
}
```

### 3. Migration Check Script
Add a pre-deployment check to ensure all required tables exist:

```sql
-- Pre-deployment validation
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leases') THEN
    missing_tables := array_append(missing_tables, 'leases');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    missing_tables := array_append(missing_tables, 'messages');
  END IF;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %', missing_tables;
  END IF;
END $$;
```

---

## Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260324000100_create_leases_messages_tables.sql` | Created | Creates missing leases and messages tables |
| `supabase/migrations/20260324000200_fix_users_rls_policies.sql` | Created | Fixes RLS policies on users table |
| `SETTINGS_BLANK_FIX.md` | Created | This documentation file |

---

## Status: ✅ READY FOR DEPLOYMENT

The migrations are ready to be run on the Supabase project. Once applied, the Settings page should load correctly without blank screens or console errors.
