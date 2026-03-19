# Telegram Bot Deployment Status Report

**Project:** landlord-bot-live  
**Project Ref:** qmnngzevquidtvcopjcu  
**Date:** 2026-03-11  
**Time:** 18:28 EDT

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| SQL Migration File | ✅ Created | `supabase/migrations/20260311000000_telegram_tables.sql` |
| Edge Function Code | ✅ Created | `supabase/functions/telegram-bot/index.ts` |
| Deployment Guide | ✅ Created | `TELEGRAM_DEPLOYMENT_GUIDE.md` |
| SQL Execution | ⏳ Manual Required | Requires Dashboard access or CLI auth |
| Edge Function Deploy | ⏳ Manual Required | Requires Dashboard access or CLI auth |
| Secrets Setup | ⏳ Manual Required | Requires Dashboard access or CLI auth |
| Webhook Config | ⏳ Manual Required | Requires Telegram Bot Token |

---

## Files Created ✅

### 1. Edge Function: `supabase/functions/telegram-bot/index.ts`
- Handles Telegram webhook requests
- Links tenants to units via `/start UNIT_CODE` command
- Processes messages with optional Gemini AI integration
- Logs messages to database
- Returns appropriate responses to tenants

### 2. SQL Migration: `supabase/migrations/20260311000000_telegram_tables.sql`
Creates two tables:

**telegram_tenants:**
- `id` (uuid, PK)
- `chat_id` (text, unique)
- `unit_code` (text)
- `tenant_name` (text)
- `phone_number` (text)
- `landlord_user_id` (uuid → users.id)
- `joined_at` (timestamptz)
- `last_message_at` (timestamptz)
- `is_active` (boolean)

**landlord_telegram:**
- `id` (uuid, PK)
- `user_id` (uuid → users.id, unique)
- `bot_token` (text)
- `bot_username` (text)
- `webhook_url` (text)
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- idx_telegram_tenants_chat
- idx_telegram_tenants_unit
- idx_telegram_tenants_landlord

**RLS Policies:**
- Landlords can only view their own tenants
- Landlords can only manage their own bot config

### 3. Deployment Guide: `TELEGRAM_DEPLOYMENT_GUIDE.md`
- Complete step-by-step instructions
- Manual dashboard steps documented
- CLI commands documented (if CLI becomes available)
- Troubleshooting section included

---

## Manual Steps Required ⏳

### Step 1: Execute SQL Migration

**Via Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/sql
2. Create new query
3. Paste the SQL migration (shown below)
4. Click Run

**SQL to Execute:**
```sql
-- Telegram tenant linking table
CREATE TABLE IF NOT EXISTS telegram_tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id text NOT NULL UNIQUE,
  unit_code text,
  tenant_name text,
  phone_number text,
  landlord_user_id uuid REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  is_active boolean DEFAULT true
);

-- Landlord bot configuration table
CREATE TABLE IF NOT EXISTS landlord_telegram (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) NOT NULL UNIQUE,
  bot_token text,
  bot_username text,
  webhook_url text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_tenants_chat ON telegram_tenants(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_tenants_unit ON telegram_tenants(unit_code);
CREATE INDEX IF NOT EXISTS idx_telegram_tenants_landlord ON telegram_tenants(landlord_user_id);

-- RLS policies
ALTER TABLE telegram_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_telegram ENABLE ROW LEVEL SECURITY;

-- Landlords can only see their own tenants
CREATE POLICY "Landlords can view their tenants" ON telegram_tenants
  FOR SELECT USING (landlord_user_id = auth.uid());

-- Landlords can only see their own bot config
CREATE POLICY "Landlords can manage their bot" ON landlord_telegram
  FOR ALL USING (user_id = auth.uid());
```

### Step 2: Set Edge Function Secrets

**Via Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/settings/functions
2. Add these secrets:

| Secret | Value | Required |
|--------|-------|----------|
| `TELEGRAM_BOT_TOKEN` | (your token from @BotFather) | ✅ Yes |
| `GEMINI_API_KEY` | (your Google Gemini API Key) | ❌ Optional |
| `SUPABASE_URL` | `https://qmnngzevquidtvcopjcu.supabase.co` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94` | ✅ Yes |

### Step 3: Deploy Edge Function

**Via Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/functions
2. Click "New Function"
3. Name: `telegram-bot`
4. Copy contents from `supabase/functions/telegram-bot/index.ts`
5. Deploy with "--no-verify-jwt" option

**Or via CLI (requires login):**
```bash
npx supabase login
npx supabase link --project-ref qmnngzevquidtvcopjcu
npx supabase functions deploy telegram-bot --no-verify-jwt
```

### Step 4: Set Telegram Webhook

After function is deployed:

```bash
# Get webhook info first
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo

# Set webhook (replace with actual token)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://qmnngzevquidtvcopjcu.supabase.co/functions/v1/telegram-bot"}'
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## Configuration Details

### Edge Function Endpoint
```
https://qmnngzevquidtvcopjcu.supabase.co/functions/v1/telegram-bot
```

### Required Secrets
- **TELEGRAM_BOT_TOKEN**: From @BotFather
- **SUPABASE_URL**: Project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Service role key for database access
- **GEMINI_API_KEY**: Optional, for AI responses

### Security Notes
- Function requires `--no-verify-jwt` since Telegram sends unauthenticated webhooks
- RLS policies restrict landlords to their own data
- Service Role Key is used server-side only (never exposed to client)

---

## Testing After Deployment

1. Send `/start UNIT123` to your bot
2. Check `telegram_tenants` table for new entry
3. Send a regular message
4. Verify response is received

---

## Troubleshooting

**Migration fails?**
- Ensure `users` table exists (migration references it)
- Check Supabase logs in Dashboard

**Function not deploying?**
- Verify secrets are set
- Check function compilation errors

**Bot not responding?**
- Check webhook URL: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check Edge Function logs in Dashboard
- Verify TELEGRAM_BOT_TOKEN secret matches @BotFather token

**Database errors?**
- Check RLS policy conflicts
- Verify foreign key constraints (users table must exist)

---

## Resources

- **Telegram BotFather**: https://t.me/botfather
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu
- **Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

**Report Generated:** 2026-03-11 18:28 EDT  
**Status:** Ready for manual deployment steps
