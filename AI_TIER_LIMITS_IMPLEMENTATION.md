# AI Tier Limits Implementation Report

## Summary
Successfully implemented tier-based AI request limits to replace the previous `FREE_LIMIT = Infinity` configuration. The system now enforces:
- **Free Tier**: 50 requests/day
- **Pro Tier**: 500 requests/day  
- **Concierge Tier**: Unlimited requests

## Changes Made

### 1. Updated `src/services/aiUsage.ts`
**Changes:**
- Added `TIER_AI_LIMITS` constant with tier-based limits (free: 50, pro: 500, concierge: Infinity)
- Added `TIER_AI_MODELS` constant for model selection per tier (concierge gets gemini-1.5-pro)
- Added `getUserSubscriptionTier()` function to fetch user's tier from database
- Added `getTierLimit()` and `getTierModel()` helper functions
- Added `isTierUnlimited()` helper function
- Updated `checkAIQuota()` to:
  - Fetch user's subscription tier
  - Apply appropriate limit based on tier
  - Calculate warning state at 80% threshold
  - Calculate exceeded state at 100% limit
  - Generate appropriate warning messages
- Updated `incrementAIUsage()` to store the tier-based limit in the database
- Updated `getAIUsageStatus()` to include tier information
- Added `formatRemainingRequests()` and `formatTierName()` utility functions
- Added `SubscriptionTier` type export

**Key Features:**
- 80% warning threshold: Shows warning modal when user approaches limit
- 100% hard limit: Blocks further AI requests until reset
- Rolling 24-hour window: Limits reset based on first request time, not midnight

### 2. Updated `src/components/AIUsageBar.tsx`
**Changes:**
- Updated to accept `AIQuotaStatus` object instead of individual props
- Added progress bar showing usage percentage for limited tiers
- Added color-coded states (green/amber/red) based on usage level
- Added tier name display
- Added upgrade prompt when approaching or at limit
- Updated tooltip to show all three tier options
- Added compact version with color-coded status

**UI States:**
- Green: Normal usage (< 80%)
- Amber: Warning (≥ 80%, < 100%)
- Red: Limit reached (≥ 100%)

### 3. Updated `src/components/AIUsageWarningModal.tsx`
**Changes:**
- Complete redesign from "unlimited" message to actual warning modal
- Shows usage progress bar at 80%+ threshold
- Lists Pro plan benefits (500 requests/day, analytics, support, etc.)
- Provides "Upgrade to Pro" and "Continue with Current Plan" CTAs
- Shows remaining requests and reset information

### 4. Updated `src/components/AIUsageExceededModal.tsx`
**Changes:**
- Complete redesign from "unlimited" message to limit exceeded modal
- Shows locked state with red styling
- Displays "Upgrade to Pro" primary CTA
- Added "Remind Me Tomorrow" secondary option with localStorage persistence
- Shows current usage count vs limit
- Lists Pro plan benefits

### 5. Updated `src/pages/LandlordAssistant.tsx`
**Changes:**
- Removed hardcoded `FREE_LIMIT = Infinity`
- Integrated with new `aiUsage.ts` service
- Added `quota` state to track AI usage from database
- Added periodic quota refresh (every 60 seconds)
- Integrated warning/exceeded modals with quota state
- Updated AI usage bar to show real quota data
- Added upgrade prompt in chat input area when limit reached
- Chat input is disabled when limit is exceeded
- Shows remaining requests or "unlimited" in footer

### 6. Created Database Migration `supabase/migrations/20260324_add_ai_usage_tracking.sql`
**Created:**
- `ai_usage` table with:
  - `user_id` (foreign key to users)
  - `request_date` (date of requests)
  - `requests_used` (count in 24h window)
  - `requests_limit` (tier-based limit)
  - `last_request_at` (for rolling window)
  - Timestamps
- Indexes for efficient queries
- RLS policies for user data isolation
- Trigger for `updated_at` timestamp
- `get_user_ai_usage()` helper function
- Default subscription plans with AI limits:
  - Free: 50/day
  - Pro: 500/day
  - Concierge: unlimited (NULL)

### 7. Updated `src/features/billing/types/billing.types.ts`
**Changes:**
- Added 'pro' to `SubscriptionTier` type: `'free' | 'pro' | 'concierge'`

## Testing Instructions

### Test Free Tier (50 requests/day)
1. Create/login with a free tier user
2. Open Landlord Assistant page
3. Verify AI Usage Bar shows "50 remaining"
4. Make 40 AI requests
5. Verify warning modal appears at 80% (40 requests)
6. Make 10 more requests
7. Verify limit reached modal appears at 50 requests
8. Verify chat input is disabled
9. Verify "Upgrade" button navigates to billing

### Test Pro Tier (500 requests/day)
1. Upgrade user to Pro tier
2. Verify AI Usage Bar shows "500 remaining"
3. Make 400 AI requests
4. Verify warning modal appears at 80% (400 requests)
5. Verify no limit reached until 500 requests

### Test Concierge Tier (Unlimited)
1. Upgrade user to Concierge tier
2. Verify AI Usage Bar shows "Unlimited"
3. Make any number of requests
4. Verify no warning or limit modals appear

### Test Reset Behavior
1. Make some AI requests
2. Wait 24 hours from first request
3. Verify counter resets to 0
4. Verify new requests are allowed

## API for Team 2 (Guardrails)

Team 2 can use the following from `aiUsage.ts`:

```typescript
// Constants
TIER_AI_LIMITS = { free: 50, pro: 500, concierge: Infinity }
TIER_AI_MODELS = { free: 'gemini-1.5-flash', pro: 'gemini-1.5-flash', concierge: 'gemini-1.5-pro' }

// Functions
getUserSubscriptionTier(userId: string) -> SubscriptionTier
checkAIQuota(userId: string) -> AIQuotaStatus
validateAIQuota(userId: string) -> Result<AIQuotaStatus, AppError>
incrementAIUsage(userId: string) -> void
getTierLimit(tier: SubscriptionTier) -> number
getTierModel(tier: SubscriptionTier) -> string
isTierUnlimited(tier: SubscriptionTier) -> boolean

// Types
SubscriptionTier = 'free' | 'pro' | 'concierge'
AIQuotaStatus = {
  used: number,
  limit: number,
  remaining: number,
  tier: SubscriptionTier,
  isUnlimited: boolean,
  canProceed: boolean,
  percentUsed: number,
  warning?: string,
  showWarning: boolean,
  showExceeded: boolean
}
```

## Files Modified
1. `src/services/aiUsage.ts` - Complete rewrite with tier enforcement
2. `src/components/AIUsageBar.tsx` - Updated to show tier-based usage
3. `src/components/AIUsageWarningModal.tsx` - Redesigned for 80% warning
4. `src/components/AIUsageExceededModal.tsx` - Redesigned for 100% limit
5. `src/pages/LandlordAssistant.tsx` - Integrated new quota system
6. `src/features/billing/types/billing.types.ts` - Added 'pro' tier

## Files Created
1. `supabase/migrations/20260324_add_ai_usage_tracking.sql` - Database schema

## Backwards Compatibility
- Existing users default to 'free' tier (50 requests/day)
- Previous unlimited behavior is now only for Concierge tier
- localStorage usage tracking removed in favor of database
- No breaking changes to existing APIs

## Security Considerations
- RLS policies ensure users can only access their own usage data
- Quota checks happen server-side via database
- Client-side checks are for UX only, not security

## Performance Considerations
- Indexed queries for user_id + date
- 60-second refresh interval for quota (not real-time to reduce load)
- Cleanup of records older than 30 days
