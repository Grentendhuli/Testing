import postgres from 'postgres';

// Use connection pooling (transaction mode)
const sql = postgres('postgresql://postgres.qmnngzevquidtvcopjcu:L!VJZ_icZ7hfSQv@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true', {
  connect_timeout: 30,
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

const migrations = [
  `-- Migration 1: Bot Token Encryption
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  ALTER TABLE public.bot_settings 
  ADD COLUMN IF NOT EXISTS bot_token_encrypted bytea;
  
  CREATE OR REPLACE FUNCTION public.encrypt_bot_token(plain_token text)
  RETURNS bytea AS $$
  DECLARE
      encryption_key text;
  BEGIN
      encryption_key := current_setting('bot.encryption_key', true);
      IF encryption_key IS NULL OR encryption_key = '' THEN
          RAISE EXCEPTION 'BOT_TOKEN_ENCRYPTION_KEY not configured';
      END IF;
      RETURN pgp_sym_encrypt(plain_token, encryption_key);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  CREATE OR REPLACE FUNCTION public.decrypt_bot_token(encrypted_token bytea)
  RETURNS text AS $$
  DECLARE
      encryption_key text;
  BEGIN
      encryption_key := current_setting('bot.encryption_key', true);
      IF encryption_key IS NULL OR encryption_key = '' THEN
          RAISE EXCEPTION 'BOT_TOKEN_ENCRYPTION_KEY not configured';
      END IF;
      RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;`,
  
  `-- Migration 2: AI Rate Limit RPC
  CREATE OR REPLACE FUNCTION public.increment_ai_usage_secure(p_user_id UUID)
  RETURNS JSONB AS $$
  DECLARE
      v_tier TEXT; v_limit INTEGER; v_used INTEGER;
      v_today DATE; v_existing_record RECORD;
      v_can_proceed BOOLEAN; v_remaining INTEGER;
  BEGIN
      v_today := CURRENT_DATE;
      SELECT subscription_tier INTO v_tier FROM public.users WHERE id = p_user_id;
      IF v_tier IS NULL THEN v_tier := 'free'; END IF;
      
      v_limit := CASE v_tier
          WHEN 'free' THEN 50
          WHEN 'pro' THEN 500
          WHEN 'concierge' THEN -1
          ELSE 50
      END;
      
      IF v_limit = -1 THEN
          INSERT INTO public.ai_usage_daily (user_id, request_date, requests_used, requests_limit, last_request_at)
          VALUES (p_user_id, v_today, 1, v_limit, NOW())
          ON CONFLICT (user_id, request_date) DO UPDATE 
          SET requests_used = public.ai_usage_daily.requests_used + 1, last_request_at = NOW();
          
          RETURN jsonb_build_object('can_proceed', true, 'tier', v_tier, 'limit', 'unlimited');
      END IF;
      
      SELECT * INTO v_existing_record FROM public.ai_usage_daily
      WHERE user_id = p_user_id AND request_date = v_today FOR UPDATE;
      
      IF FOUND THEN
          v_used := v_existing_record.requests_used;
          IF v_used >= v_limit THEN
              RETURN jsonb_build_object('can_proceed', false, 'tier', v_tier, 'limit', v_limit, 'used', v_used);
          ELSE
              v_used := v_used + 1;
              UPDATE public.ai_usage_daily SET requests_used = v_used, last_request_at = NOW()
              WHERE user_id = p_user_id AND request_date = v_today;
              RETURN jsonb_build_object('can_proceed', true, 'tier', v_tier, 'limit', v_limit, 'used', v_used, 'remaining', v_limit - v_used);
          END IF;
      ELSE
          INSERT INTO public.ai_usage_daily (user_id, request_date, requests_used, requests_limit, last_request_at)
          VALUES (p_user_id, v_today, 1, v_limit, NOW());
          RETURN jsonb_build_object('can_proceed', true, 'tier', v_tier, 'limit', v_limit, 'used', 1, 'remaining', v_limit - 1);
      END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  GRANT EXECUTE ON FUNCTION public.increment_ai_usage_secure(UUID) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.increment_ai_usage_secure(UUID) TO anon;`
];

async function applyMigrations() {
  try {
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Applying migration ${i + 1}...`);
      await sql.unsafe(migrations[i]);
      console.log(`✅ Migration ${i + 1} applied successfully`);
    }
    console.log('\n✅ All migrations applied!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigrations();
