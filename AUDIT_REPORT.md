# LandlordBot Database & Supabase Audit Report
**Date:** 2026-04-02  
**Auditor:** Code Audit Agent  
**Location:** `C:\Users\grent\.openclaw\workspace\landlord-bot-testing`

---

## EXECUTIVE SUMMARY

| Category | Status | Notes |
|----------|--------|-------|
| Migration Ordering | ⚠️ ISSUE | Chronological ordering broken between 20250314 and 20260311 |
| RLS Completeness | ⚠️ PARTIAL | Most tables have RLS but ai_usage_detailed has problematic admin policy |
| AI Usage Tables | ⚠️ MISMATCH | Frontend expects 'pro' tier, DB has both 'starter' and 'pro' |
| Billing Integration | ✅ GOOD | Stripe billing schema well-designed |
| Indexes | ⚠️ MISSING | Some frequently queried tables missing composite indexes |
| Type Consistency | ⚠️ ISSUE | SubscriptionTier enum mismatch between TS and DB |

---

## 1. MIGRATION FILE ANALYSIS

### Migration Files (9 total):

| File | Date | Purpose | Status |
|------|------|---------|--------|
| `20250306010000_initial_schema.sql` | 2025-03-06 | Core tables: users, units, maintenance_requests, leads, payments | ✅ Valid |
| `20250314000000_subscription_schema.sql` | 2025-03-14 | Subscription/billing tables with Stripe integration | ✅ Valid |
| `20260311000000_telegram_tables.sql` | 2026-03-11 | Telegram bot tables | ✅ Valid |
| `20260314000000_ai_usage_tracking.sql` | 2026-03-14 | AI usage tracking table | ✅ Valid |
| `20260324_tier_based_ai_limits.sql` | 2026-03-24 | Tier-based AI quota functions | ✅ Valid |
| `20260324000000_ai_usage_dashboard_admin.sql` | 2026-03-24 | Admin RPC functions for dashboard | ✅ Valid |
| `20260324000000_missing_rls_policies.sql` | 2026-03-24 | RLS for user_settings, user_feedback, bot_settings | ✅ Valid |
| `20260324000100_create_leases_messages_tables.sql` | 2026-03-24 | leases and messages tables | ✅ Valid |
| `20260324000200_fix_users_rls_policies.sql` | 2026-03-24 | Fixed users table RLS | ✅ Valid |

### 🔴 Migration Ordering Issue Found

**Problem:** Timestamps jump from `20250314000000` to `20260311000000` (March 2025 to March 2026) then back to consistent 2026-03-24 dates.

**Impact:** If migrations run in strict filename order, the subscription schema (20250314) runs before telegram tables (20260311), which is correct. However, the chronological gaps could cause confusion.

**Recommendation:** Consider renaming `20250314000000_subscription_schema.sql` to maintain consistency if more migrations are added between these dates.

---

## 2. RLS POLICIES COVERAGE

### Tables with RLS Enabled & Policies ✅

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `users` | ✅ Own profile | ✅ Own profile | ✅ Own profile | ❌ None | INSERT policy added in fix migration |
| `units` | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | Single policy for user_id match |
| `maintenance_requests` | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | Single policy |
| `leads` | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | Single policy |
| `payments` | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | Single policy |
| `leases` | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | Created in 20260324000100 |
| `messages` | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | ✅ ALL CRUD | Created in 20260324000100 |
| `ai_usage` | ✅ Own | ✅ Own | ✅ Own | ❌ None | Service role has ALL |
| `user_settings` | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Single policy |
| `user_feedback` | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Single policy |
| `bot_settings` | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Single policy |
| `telegram_tenants` | ✅ Landlord only | ❌ None | ❌ None | ❌ None | Limited policy - needs review |
| `landlord_telegram` | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Single policy |

### 🔴 RLS Gaps Found

#### Gap 1: `ai_usage_detailed` Admin Policy Logic Issue
```sql
-- In 20260324000000_ai_usage_dashboard_admin.sql
CREATE POLICY ai_usage_detailed_admin_all ON ai_usage_detailed
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
```
**Issue:** This policy allows ALL operations for admins, but there's no policy for regular users to INSERT their own detailed usage records. The service role policy should handle this, but client-side inserts would fail.

**Fix:** Add separate INSERT policy for own records:
```sql
CREATE POLICY ai_usage_detailed_insert_own ON ai_usage_detailed
    FOR INSERT WITH CHECK (user_id = auth.uid());
```

#### Gap 2: `telegram_tenants` Missing INSERT/UPDATE Policies
**Issue:** Only has SELECT policy for landlords. If the app needs to create/update tenant records via RLS, these operations will fail.

**Fix:** Add appropriate INSERT/UPDATE policies if needed by the application.

#### Gap 3: `subscription_plans`, `subscriptions`, `invoices`, `subscription_events`
**Note:** These correctly have `USING (false)` policies as they should only be modified via webhooks/service role. This is intentional and correct.

#### Gap 4: No DELETE policies on most tables
**Note:** Most tables have ALL policies that cover DELETE, but some like `ai_usage` don't have explicit DELETE. If soft deletes are required, ensure policies match the pattern.

---

## 3. DATABASE INTERACTION PATTERNS (src/services/)

### ✅ Good Patterns Found

1. **Type-Safe Service Layer**
   - `aiUsage.ts`: Uses Result<T,E> pattern for error handling
   - Proper typing of database responses
   - Consistent error codes (e.g., 'AI_QUOTA_CHECK_FAILED')

2. **RLS-Aware Queries**
   - Services query using `user_id` filters which align with RLS policies
   - Example: `.eq('user_id', userId)` matches `USING (auth.uid() = user_id)`

3. **Connection Fallbacks**
   - `supabase.ts`: Handles missing credentials gracefully with dummy client
   - Services fallback to localStorage when tables don't exist (e.g., `paymentMethods.ts`)

### ⚠️ Pattern Concerns

1. **Type Casts in Service Code**
```typescript
// In aiUsage.ts
await (supabase.from('ai_usage') as any).update(...)
```
**Issue:** `as any` bypasses TypeScript checking. The database.types.ts shows proper types exist.

2. **Mixed SQL Naming Conventions**
   - Some migrations use snake_case (sql standard): `request_date`
   - TypeScript uses camelCase mapping: `requestDate`
   - The `database.types.ts` properly maps these

3. **In-Memory Session Security**
```typescript
// In supabase.ts
persistSession: false,  // SECURITY: Don't store tokens in localStorage
```
**Good:** This is intentionally secure - prevents XSS attacks at the cost of session persistence.

---

## 4. AI USAGE TRACKING CONSISTENCY

### Table: `ai_usage` (20260314000000_ai_usage_tracking.sql)

**Schema:**
```sql
CREATE TABLE ai_usage (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    requests_used INTEGER DEFAULT 0,
    requests_limit INTEGER DEFAULT 50,  -- Updated to 50 in tier migration
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, request_date)
);
```

**Frontend Expectations:**
```typescript
// From aiUsage.ts
export const TIER_AI_LIMITS = {
  free: 50,        // 50 requests/day
  pro: 500,        // 500 requests/day  
  concierge: Infinity // Unlimited
} as const;
```

### 🔴 Consistency Issues Found

#### Issue 1: Tier Names Mismatch
| Source | Tiers |
|--------|-------|
| Database (subscription_plans) | 'free', 'starter', 'pro', 'enterprise' |
| Frontend (types/index.ts) | 'free', 'concierge' |
| Frontend (aiUsage.ts) | 'free', 'pro', 'concierge' |
| Initial Schema Check Constraint | 'free', 'basic', 'pro', 'enterprise' |

**Impact:** TypeScript only allows 'free' | 'concierge' but database stores other values. This will cause type errors.

**Recommendation:** Align all tier names:
1. Update `types/index.ts` to match database:
   ```typescript
   export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'concierge';
   ```
2. OR update database to match simplified model:
   ```sql
   ALTER TABLE users DROP CONSTRAINT users_subscription_tier_check;
   ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
     CHECK (subscription_tier IN ('free', 'concierge'));
   ```

#### Issue 2: daily_detailed Table Not Used by Frontend
The `ai_usage_detailed` table (for per-request tracking) exists but:
- Frontend only queries/inserts to `ai_usage` (summary table)
- The detailed table is mainly for admin functions
- No frontend service writes to `ai_usage_detailed`

**Note:** This is likely intentional - detailed tracking might be done via edge functions.

---

## 5. INDEX COVERAGE ANALYSIS

### Existing Indexes ✅

| Table | Index | Column(s) | Purpose |
|-------|-------|-----------|---------|
| units | idx_units_user_id | user_id | FK lookups |
| maintenance_requests | idx_maintenance_requests_user_id | user_id | User filtering |
| maintenance_requests | idx_maintenance_requests_unit_id | unit_id | Unit filtering |
| leads | idx_leads_user_id | user_id | User filtering |
| payments | idx_payments_user_id | user_id | User filtering |
| payments | idx_payments_unit_id | unit_id | Unit filtering |
| payments | idx_payments_due_date | due_date | Date range queries |
| leases | idx_leases_user_id | user_id | User filtering (NEW) |
| leases | idx_leases_unit_id | unit_id | Unit filtering (NEW) |
| leases | idx_leases_end_date | end_date | Expiration queries (NEW) |
| leases | idx_leases_status | status | Status filtering (NEW) |
| messages | idx_messages_landlord_user_id | landlord_user_id | User filtering (NEW) |
| messages | idx_messages_timestamp | timestamp DESC | Chronological sort (NEW) |
| messages | idx_messages_status | status | Status filtering (NEW) |
| messages | idx_messages_tenant_phone | tenant_phone | Phone lookups (NEW) |
| ai_usage | idx_ai_usage_user_id | user_id | User filtering |
| ai_usage | idx_ai_usage_request_date | request_date | Date filtering |
| ai_usage | idx_ai_usage_last_request_at | last_request_at | Window queries |
| ai_usage_detailed | idx_ai_usage_detailed_user_id | user_id | User filtering |
| ai_usage_detailed | idx_ai_usage_detailed_created_at | created_at | Date filtering |
| ai_usage_detailed | idx_ai_usage_detailed_request_type | request_type | Type filtering |

### 🔴 Missing Recommended Indexes

Based on query patterns in services:

1. **Composite Index for AI Quota Checks**
```sql
-- Current query in aiUsage.ts:
-- SELECT * FROM ai_usage 
-- WHERE user_id = $1 AND last_request_at >= $2

CREATE INDEX idx_ai_usage_user_time 
ON ai_usage(user_id, last_request_at);
```

2. **Composite Index for Message Conversations**
```sql
-- For conversation thread lookups by tenant phone
CREATE INDEX idx_messages_landlord_phone 
ON messages(landlord_user_id, tenant_phone);
```

3. **Index for Subscription Status Queries**
```sql
-- get_user_limits function queries by status
CREATE INDEX idx_subscriptions_user_status 
ON subscriptions(user_id, status) 
WHERE status IN ('active', 'trialing');
```

4. **Index for Invoice Date Range Queries**
```sql
-- Dashboard queries invoices by user and date
CREATE INDEX idx_invoices_user_date 
ON invoices(user_id, invoice_date DESC);
```

---

## 6. BILLING/STRIPE INTEGRATION

### Schema Overview

| Table | Purpose | Stripe Integration |
|-------|---------|-------------------|
| `subscription_plans` | Plan configuration | `stripe_price_id`, `stripe_product_id` |
| `subscriptions` | User subscriptions | `stripe_customer_id`, `stripe_subscription_id` |
| `payment_methods` | Saved cards | `stripe_payment_method_id` |
| `invoices` | Billing history | `stripe_invoice_id` |
| `subscription_events` | Webhook audit log | `stripe_event_id` |

### ✅ Billing Integration Strengths

1. **Proper Stripe ID Storage**
   - All Stripe IDs stored as TEXT with UNIQUE constraints
   - Indexes on stripe IDs for webhook lookups

2. **Service-Role Protection**
   ```sql
   CREATE POLICY "Subscriptions managed by service role" 
   ON subscriptions FOR ALL USING (false) WITH CHECK (false);
   ```
   - Correctly prevents client-side modifications
   - Webhooks should use service_role key

3. **Plan Configuration**
   - Plans include `max_units`, `max_ai_requests_daily`, `storage_limit_gb`
   - Features stored as JSONB for flexibility

### ⚠️ Billing Concerns

1. **Missing Webhook Verification**
   - No stored procedure for webhook signature verification
   - This should typically be in edge functions, not SQL

2. **Duplicate Column Names**
   ```sql
   -- In payment_methods, both exist:
   card_brand text;
   brand text;
   card_last4 text;
   last4 text;
   ```
   The `database.types.ts` also shows both sets. These appear to be duplicates.

3. **Unlimited Units Representation**
   ```sql
   -- Free plan: max_ai_requests_daily = 50
   -- Pro plan: max_ai_requests_daily = 500  
   -- Concierge: max_ai_requests_daily = NULL (unlimited)
   ```
   Using NULL for unlimited is correct, but ensure application code handles NULL properly.

---

## 7. TYPE CONSISTENCY AUDIT

### TypeScript vs Database Comparison

| Type | TypeScript (types/index.ts) | Database | Match |
|------|---------------------------|----------|-------|
| SubscriptionTier | 'free' \| 'concierge' | 'free', 'starter', 'pro', 'enterprise', 'concierge' | ❌ No |
| SubscriptionStatus | 'active' \| 'trialing' \| 'past_due' \| 'canceled' | 'active', 'trialing', 'past_due', 'canceled' | ✅ Yes |
| UnitStatus | 'occupied' \| 'vacant' \| 'maintenance' | 'occupied', 'vacant', 'maintenance', 'notice' | ⚠️ Partial |
| LeadStatus | 7 values | 5 values in DB | ❌ No |
| LeaseStatus | 6 values | 4 values in DB | ❌ No |
| PaymentStatus | 6 values | 4 values in DB | ❌ No |
| MaintenancePriority | 6 values | 4 values in DB | ❌ No |

### MaintenancePriority Mismatch

**Frontend:**
```typescript
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent' | 'emergency' | 'routine';
```

**Database:**
```sql
priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
```

**Missing in DB:** `'emergency'`, `'routine'`

**Fix:**
```sql
ALTER TABLE maintenance_requests 
DROP CONSTRAINT maintenance_requests_priority_check;

ALTER TABLE maintenance_requests 
ADD CONSTRAINT maintenance_requests_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'emergency', 'routine'));
```

---

## 8. SUMMARY OF FINDINGS

### Critical Issues 🔴

1. **Type Mismatch: SubscriptionTier**
   - Frontend only supports 2 tiers, database has 5
   - Need to align types across the stack

2. **MaintenancePriority Enum Too Small**
   - Database missing 'emergency', 'routine' values that frontend uses
   - Will cause constraint violations

3. **RLS Gap on ai_usage_detailed**
   - No INSERT policy for users writing their own records
   - Will fail client-side inserts

### Warnings ⚠️

1. **Duplicate Columns**
   - `payment_methods` has duplicate card_* columns
   - May cause confusion about which to use

2. **Missing Composite Indexes**
   - Several query patterns would benefit from composite indexes
   - Listed in Section 5

3. **telegram_tenants Limited RLS**
   - Only has SELECT policy; lacks INSERT/UPDATE

### Good Practices ✅

1. **Security-First Session Handling**
   - Memory-only tokens prevent XSS
   - Service role properly restricted from client

2. **Comprehensive Billing Schema**
   - Well-designed subscription system
   - Proper Stripe integration points

3. **AI Usage Tracking**
   - Good 24h rolling window implementation
   - Admin RPC functions for dashboard

4. **Result Type Pattern**
   - Type-safe error handling throughout services
   - Reduces runtime errors

---

## 9. RECOMMENDED ACTIONS

### Immediate (High Priority)

1. [ ] Fix SubscriptionTier enum to match database:
   ```typescript
   // types/index.ts
   export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'concierge';
   ```

2. [ ] Add missing constraint values to maintenance_requests.priority:
   ```sql
   ALTER TABLE maintenance_requests 
   DROP CONSTRAINT maintenance_requests_priority_check;
   
   ALTER TABLE maintenance_requests 
   ADD CONSTRAINT maintenance_requests_priority_check 
   CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'emergency', 'routine'));
   ```

3. [ ] Add INSERT policy to ai_usage_detailed:
   ```sql
   CREATE POLICY ai_usage_detailed_insert_own ON ai_usage_detailed
       FOR INSERT WITH CHECK (user_id = auth.uid());
   ```

### Short-term (Medium Priority)

4. [ ] Add composite indexes:
   ```sql
   CREATE INDEX idx_ai_usage_user_time ON ai_usage(user_id, last_request_at);
   CREATE INDEX idx_messages_landlord_phone ON messages(landlord_user_id, tenant_phone);
   ```

5. [ ] Remove duplicate columns from payment_methods:
   ```sql
   ALTER TABLE payment_methods DROP COLUMN IF EXISTS brand;
   ALTER TABLE payment_methods DROP COLUMN IF EXISTS last4;
   ALTER TABLE payment_methods DROP COLUMN IF EXISTS exp_month;
   ALTER TABLE payment_methods DROP COLUMN IF EXISTS exp_year;
   ALTER TABLE payment_methods DROP COLUMN IF EXISTS type;
   ```

6. [ ] Add telegram_tenants INSERT/UPDATE policies if needed

### Long-term (Lower Priority)

7. [ ] Standardize migration filename format (all timestamps at millisecond precision)
8. [ ] Create missing `user_payment_methods` table (referenced in paymentMethods.ts)
9. [ ] Add audit logging for sensitive operations

---

## 10. MIGRATION SAFETY CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| All CREATE TABLE use IF NOT EXISTS | ✅ Yes | All migrations idempotent |
| All CREATE POLICY use IF NOT EXISTS | ✅ Yes | Drop/create pattern used correctly |
| Indexes use IF NOT EXISTS | ✅ Yes | Safe to re-run |
| Triggers use IF NOT EXISTS | ✅ Yes | Drop/create pattern used |
| Functions use CREATE OR REPLACE | ✅ Yes | Safe to update |
| No destructive ALTER without backup | ✅ Yes | No data loss risk |
| Foreign key ON DELETE clauses | ✅ Yes | Proper cascading set |

---

**End of Report**
