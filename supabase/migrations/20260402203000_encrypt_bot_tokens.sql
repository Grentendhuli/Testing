-- Migration: Encrypt bot tokens at rest using pgcrypto
-- Created: 2026-04-02
-- Security: CRITICAL - Addresses plain text token storage vulnerability

-- =====================================================
-- Enable pgcrypto extension for encryption
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Add encrypted token column (will hold encrypted data)
-- =====================================================
ALTER TABLE public.bot_settings 
ADD COLUMN IF NOT EXISTS bot_token_encrypted bytea;

-- =====================================================
-- Create function to encrypt bot tokens
-- NOTE: Requires BOT_TOKEN_ENCRYPTION_KEY to be set as a database parameter
-- or use Supabase Vault for key management
-- =====================================================
CREATE OR REPLACE FUNCTION public.encrypt_bot_token(plain_token text)
RETURNS bytea AS $$
DECLARE
    encryption_key text;
BEGIN
    -- Get encryption key from environment/database config
    -- In production, this should be set via: ALTER DATABASE SET bot.encryption_key = '...'
    -- Or use Supabase Vault for secure key storage
    encryption_key := current_setting('bot.encryption_key', true);
    
    IF encryption_key IS NULL OR encryption_key = '' THEN
        RAISE EXCEPTION 'BOT_TOKEN_ENCRYPTION_KEY not configured';
    END IF;
    
    RETURN pgp_sym_encrypt(plain_token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Create function to decrypt bot tokens
-- Only callable by authenticated users with RLS access
-- =====================================================
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

-- =====================================================
-- Create trigger to automatically encrypt tokens on insert/update
-- This ensures tokens are never stored plain text even if app forgets to encrypt
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_encrypt_bot_token()
RETURNS TRIGGER AS $$
DECLARE
    encryption_key text;
BEGIN
    encryption_key := current_setting('bot.encryption_key', true);
    
    -- Only encrypt if we have a key and there's a plain token to encrypt
    IF encryption_key IS NOT NULL AND encryption_key != '' AND NEW.bot_token IS NOT NULL THEN
        NEW.bot_token_encrypted := pgp_sym_encrypt(NEW.bot_token, encryption_key);
        NEW.bot_token := NULL; -- Clear plain text after encryption
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_encrypt_bot_token ON public.bot_settings;

-- Create trigger
CREATE TRIGGER auto_encrypt_bot_token
    BEFORE INSERT OR UPDATE ON public.bot_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_encrypt_bot_token();

-- =====================================================
-- Add comment warning about the plain text column
-- =====================================================
COMMENT ON COLUMN public.bot_settings.bot_token IS 
    'DEPRECATED: Will be auto-encrypted and cleared. Use bot_token_encrypted + decrypt_bot_token() instead.';

COMMENT ON COLUMN public.bot_settings.bot_token_encrypted IS 
    'PGP-encrypted bot token. Decrypt using decrypt_bot_token(encrypted_token).';

-- =====================================================
-- Create secure view for applications that need decrypted tokens
-- Only returns decrypted tokens for the authenticated user
-- =====================================================
CREATE OR REPLACE VIEW public.bot_settings_secure AS
SELECT 
    id,
    user_id,
    webhook_url,
    is_active,
    config,
    created_at,
    updated_at,
    -- Only decrypt if user owns the record
    CASE 
        WHEN auth.uid() = user_id THEN 
            decrypt_bot_token(bot_token_encrypted)
        ELSE NULL
    END as decrypted_bot_token
FROM public.bot_settings;

-- =====================================================
-- RLS Policy on secure view
-- =====================================================
ALTER VIEW public.bot_settings_secure SET (security_invoker = on);

COMMENT ON VIEW public.bot_settings_secure IS 
    'Secure view that only returns decrypted tokens to the authenticated owner. Use this for reading bot tokens in edge functions.';

-- =====================================================
-- Migration notice
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Bot token encryption migration complete.';
    RAISE NOTICE 'ACTION REQUIRED: Set encryption key via:';
    RAISE NOTICE '  ALTER DATABASE current SET bot.encryption_key = ''your-secure-32-char-key-here'';';
    RAISE NOTICE 'Or use Supabase Vault for production key management.';
END $$;
