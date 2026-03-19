# Telegram Bot Deployment Guide

## Project: landlord-bot-live (qmnngzevquidtvcopjcu)

**Date:** 2026-03-11
**Status:** Ready for Deployment

---

## Step 1: Run SQL Migration

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu
2. Navigate to **SQL Editor**
3. Create a **New Query**
4. Paste the following SQL:

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

5. Click **Run**

**Expected Result:** "Success. No rows returned" or tables created confirmation.

---

## Step 2: Set Edge Function Secrets

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/settings/functions
2. Set the following secrets:

| Secret Name | Value | Required |
|-------------|-------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token from @BotFather | ✅ Yes |
| `GEMINI_API_KEY` | Your Google Gemini API Key | ❌ Optional (for AI responses) |
| `SUPABASE_URL` | `https://qmnngzevquidtvcopjcu.supabase.co` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94` | ✅ Yes |

**Via Supabase CLI** (if available):
```bash
npx supabase login
npx supabase link --project-ref qmnngzevquidtvcopjcu
npx supabase secrets set TELEGRAM_BOT_TOKEN=your_token_here
npx supabase secrets set GEMINI_API_KEY=your_key_here
npx supabase secrets set SUPABASE_URL=https://qmnngzevquidtvcopjcu.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94
```

---

## Step 3: Deploy Edge Function

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/functions
2. Click **New Function**
3. Function name: `telegram-bot`
4. Copy the contents from `supabase/functions/telegram-bot/index.ts`
5. Click **Deploy**

**Via Supabase CLI** (if available):
```bash
cd landlord-bot-live
npx supabase functions deploy telegram-bot --no-verify-jwt
```

---

## Step 4: Set Telegram Webhook

**After Deploying the Function**, set the webhook URL:

```bash
# Replace <YOUR_BOT_TOKEN> with actual token
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://qmnngzevquidtvcopjcu.supabase.co/functions/v1/telegram-bot"}'
```

**Expected Response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## Step 5: Verify Deployment

### Check Database Tables:
1. Go to **Table Editor** in Supabase Dashboard
2. Verify these tables exist:
   - `telegram_tenants`
   - `landlord_telegram`

### Check Edge Function:
1. Go to **Edge Functions** in Supabase Dashboard
2. Verify `telegram-bot` shows as **Deployed**

### Test the Bot:
1. Send `/start YOUR_UNIT_CODE` to your Telegram bot
2. Check the `telegram_tenants` table for the new entry
3. Send a message and verify response

---

## Files Created/Updated:

1. ✅ `supabase/functions/telegram-bot/index.ts` - Edge Function code
2. ✅ `supabase/migrations/20260311000000_telegram_tables.sql` - Database migration
3. ✅ `TELEGRAM_DEPLOYMENT_GUIDE.md` - This deployment guide

---

## Post-Deployment Notes:

- **Webhook URL:** `https://qmnngzevquidtvcopjcu.supabase.co/functions/v1/telegram-bot`
- **Function requires JWT verification disabled** (`--no-verify-jwt`) since Telegram sends unauthenticated webhook requests
- **GEMINI_API_KEY is optional** - without it, bot will forward messages to landlord without AI processing
- **RLS Policies** restrict landlords to only view their own tenants and bot config

---

## Troubleshooting:

**Migration fails?**
- Check if `users` table exists (the migration references it)
- Run SQL manually in dashboard and check error messages

**Function deployment fails?**
- Verify all secrets are set correctly
- Check function logs in Supabase Dashboard

**Bot not responding?**
- Verify webhook is set correctly: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check Edge Function logs in Supabase Dashboard
- Verify TELEGRAM_BOT_TOKEN secret is correct
