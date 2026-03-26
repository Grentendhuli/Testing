# LandlordBot Supabase Setup

Complete database schema for LandlordBot with Row Level Security (RLS), indexes, and triggers.

## Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles extending auth.users | ✅ Yes |
| `units` | Property units | ✅ Yes |
| `leases` | Lease agreements | ✅ Yes |
| `maintenance_requests` | Maintenance tickets | ✅ Yes |
| `payments` | Rent payments | ✅ Yes |
| `leads` | Prospective tenants | ✅ Yes |
| `expenses` | Property expenses | ✅ Yes |
| `ai_usage` | AI request tracking | ✅ Yes |
| `webhook_events` | Stripe webhooks | Service role only |

## Quick Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Name: `landlordbot-testing`
4. Region: `US East (N. Virginia)`
5. Password: Generate strong password, SAVE IT

### 2. Get Connection Details
1. Go to Project Settings → Database
2. Copy:
   - `VITE_SUPABASE_URL` (Connection string)
   - `VITE_SUPABASE_ANON_KEY` (API → Project API keys)

### 3. Apply Schema

**Option A: SQL Editor (Easiest)**
1. Go to SQL Editor in Supabase dashboard
2. New query
3. Paste contents of `001_initial_schema.sql`
4. Click "Run"

**Option B: Supabase CLI**
```bash
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 4. Test Setup

Run this in SQL Editor:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public';
```

### 5. Add to Vercel

In Vercel dashboard:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

## Schema Details

### Profiles
Extends `auth.users` with:
- Subscription tier & status
- Stripe customer/subscription IDs
- AI usage tracking
- Referral codes
- Onboarding state

### Units
Property management:
- Unit numbers, addresses
- Tenant info (name, contact)
- Rent amount, lease dates
- HPD registration
- Status tracking

### Leases
Lease agreements with:
- Document URLs
- Digital signature tracking
- Auto-renewal flags
- Renewal reminders

### Maintenance Requests
Work order tracking:
- Priority levels
- Category (plumbing, electrical, etc)
- HPD violation flagging
- AI triage data (JSONB)
- Cost tracking

### Payments
Rent collection:
- Multiple payment methods
- Receipt generation
- Period tracking
- Stripe integration

### Leads
Tenant acquisition:
- Source tracking (Zillow, etc)
- Status pipeline
- Priority scoring
- Conversion tracking

### Expenses
P&L tracking:
- Category classification
- Tax deductible flag
- Receipt attachments
- Vendor tracking

### AI Usage
Rate limiting:
- Request type
- Tokens used
- Daily/monthly aggregation

### Webhook Events
Stripe integration:
- Idempotent processing
- Event deduplication
- Error tracking

## Security

### RLS Policies
All tables have Row Level Security:
- Users can only see/edit their own data
- Service role bypasses RLS for webhooks
- Admin tier can view all profiles

### Auth Triggers
- Auto-creates profile on signup
- Generates referral codes

## Indexes

Performance indexes on:
- Foreign keys (user_id, unit_id)
- Status fields
- Date fields
- Unique constraints

## Realtime

Enabled for:
- `maintenance_requests`
- `units`
- `payments`

Subscribes to changes automatically.

## Functions

- `get_subscription_limits(tier)` - Returns limits for tier
- `reset_ai_usage()` - Monthly reset function
- `handle_new_user()` - Profile creation trigger

## Free Tier Limits

- **500MB database** — plenty for start
- **2GB bandwidth/month** — ~10K requests/day
- **Unlimited API requests** — soft limit
- **50K realtime connections**

## Troubleshooting

### "Table doesn't exist"
Run the migration SQL in Supabase SQL Editor.

### "Permission denied"
Check RLS policies are created. Verify user is authenticated.

### "Realtime not working"
Ensure tables are added to `supabase_realtime` publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tablename;
```

### "Profile not created on signup"
Check trigger exists:
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## Next Steps

1. ✅ Apply schema
2. ⬜ Add ENV vars to Vercel
3. ⬜ Test signup flow
4. ⬜ Create first unit
5. ⬜ Set up Stripe (see CLOUDFLARE_WORKER setup)
