import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qmnngzevquidtvcopjcu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migration1 = `
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const migration2 = `
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
GRANT EXECUTE ON FUNCTION public.increment_ai_usage_secure(UUID) TO anon;
`;

async function applyMigrations() {
  console.log('Applying migration 1: Bot Token Encryption...');
  const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
  if (error1) {
    console.error('Migration 1 failed:', error1);
    // Try direct SQL
    const { error: sqlError1 } = await supabase.from('_sql').select('*').eq('query', migration1);
    if (sqlError1) console.log('Fallback also failed (expected)');
  } else {
    console.log('✅ Migration 1 applied');
  }

  console.log('Applying migration 2: AI Rate Limit RPC...');
  const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
  if (error2) {
    console.error('Migration 2 failed:', error2);
  } else {
    console.log('✅ Migration 2 applied');
  }
}

applyMigrations();
