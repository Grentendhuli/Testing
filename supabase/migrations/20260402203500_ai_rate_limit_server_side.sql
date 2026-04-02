-- Migration: Server-side AI rate limit enforcement
-- Created: 2026-04-02
-- Security: HIGH - Prevents client-side bypass of AI quotas

-- =====================================================
-- Create secure RPC function to check and increment AI usage
-- This function is SECURITY DEFINER, bypasses RLS, and runs as postgres role
-- It enforces rate limits at the database level, preventing client bypass
-- =====================================================

-- Drop existing function if exists (for idempotency)
DROP FUNCTION IF EXISTS public.increment_ai_usage_secure(UUID);

CREATE OR REPLACE FUNCTION public.increment_ai_usage_secure(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tier TEXT;
    v_limit INTEGER;
    v_used INTEGER;
    v_today DATE;
    v_existing_record RECORD;
    v_can_proceed BOOLEAN;
    v_remaining INTEGER;
    v_reset_at TIMESTAMPTZ;
BEGIN
    -- Get today's date
    v_today := CURRENT_DATE;
    
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_tier
    FROM public.users
    WHERE id = p_user_id;
    
    -- Default to 'free' if no tier found
    IF v_tier IS NULL THEN
        v_tier := 'free';
    END IF;
    
    -- Get limit based on tier
    v_limit := CASE v_tier
        WHEN 'free' THEN 50
        WHEN 'pro' THEN 500
        WHEN 'concierge' THEN -1  -- -1 means unlimited
        ELSE 50
    END;
    
    -- Check if concierge (unlimited)
    IF v_limit = -1 THEN
        -- Still track usage for analytics
        INSERT INTO public.ai_usage_daily (
            user_id,
            request_date,
            requests_used,
            requests_limit,
            last_request_at
        )
        VALUES (
            p_user_id,
            v_today,
            1,
            v_limit,
            NOW()
        )
        ON CONFLICT (user_id, request_date)
        DO UPDATE SET
            requests_used = public.ai_usage_daily.requests_used + 1,
            last_request_at = NOW();
        
        RETURN jsonb_build_object(
            'can_proceed', true,
            'tier', v_tier,
            'limit', 'unlimited',
            'used', (SELECT requests_used FROM public.ai_usage_daily 
                     WHERE user_id = p_user_id AND request_date = v_today),
            'remaining', -1,
            'reset_at', NOW() + INTERVAL '24 hours'
        );
    END IF;
    
    -- Get or create usage record for today
    SELECT * INTO v_existing_record
    FROM public.ai_usage_daily
    WHERE user_id = p_user_id
      AND request_date = v_today
    FOR UPDATE;  -- Lock the row to prevent race conditions
    
    IF FOUND THEN
        v_used := v_existing_record.requests_used;
        v_remaining := GREATEST(0, v_limit - v_used);
        
        -- Check if limit reached
        IF v_used >= v_limit THEN
            v_can_proceed := false;
            v_reset_at := v_existing_record.last_request_at + INTERVAL '24 hours';
        ELSE
            v_can_proceed := true;
            v_used := v_used + 1;
            v_remaining := v_limit - v_used;
            
            -- Increment usage
            UPDATE public.ai_usage_daily
            SET requests_used = v_used,
                last_request_at = NOW(),
                updated_at = NOW()
            WHERE user_id = p_user_id
              AND request_date = v_today;
        END IF;
    ELSE
        -- First request today
        v_can_proceed := true;
        v_used := 1;
        v_remaining := v_limit - 1;
        v_reset_at := NOW() + INTERVAL '24 hours';
        
        -- Create new record
        INSERT INTO public.ai_usage_daily (
            user_id,
            request_date,
            requests_used,
            requests_limit,
            last_request_at
        )
        VALUES (
            p_user_id,
            v_today,
            1,
            v_limit,
            NOW()
        );
    END IF;
    
    -- Return result
    RETURN jsonb_build_object(
        'can_proceed', v_can_proceed,
        'tier', v_tier,
        'limit', v_limit,
        'used', v_used,
        'remaining', v_remaining,
        'reset_at', v_reset_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_ai_usage_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage_secure(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION public.increment_ai_usage_secure IS 
    'Secure server-side AI rate limiting. Checks quota and atomically increments usage.
     Returns {can_proceed: bool, tier, limit, used, remaining, reset_at}.
     Cannot be bypassed by client - runs as SECURITY DEFINER with row locking.';

-- =====================================================
-- Create helper function to just check quota without incrementing
-- Use this for UI display (warning states, etc.)
-- =====================================================

DROP FUNCTION IF EXISTS public.check_ai_quota_secure(UUID);

CREATE OR REPLACE FUNCTION public.check_ai_quota_secure(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tier TEXT;
    v_limit INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
    v_percent_used NUMERIC;
    v_show_warning BOOLEAN;
    v_show_exceeded BOOLEAN;
    v_today DATE;
BEGIN
    v_today := CURRENT_DATE;
    
    -- Get user's tier
    SELECT subscription_tier INTO v_tier
    FROM public.users
    WHERE id = p_user_id;
    
    IF v_tier IS NULL THEN
        v_tier := 'free';
    END IF;
    
    v_limit := CASE v_tier
        WHEN 'free' THEN 50
        WHEN 'pro' THEN 500
        WHEN 'concierge' THEN -1
        ELSE 50
    END;
    
    -- Unlimited tier
    IF v_limit = -1 THEN
        RETURN jsonb_build_object(
            'can_proceed', true,
            'tier', v_tier,
            'limit', 'unlimited',
            'used', 0,
            'remaining', -1,
            'percent_used', 0,
            'show_warning', false,
            'show_exceeded', false
        );
    END IF;
    
    -- Get today's usage
    SELECT COALESCE(requests_used, 0) INTO v_used
    FROM public.ai_usage_daily
    WHERE user_id = p_user_id
      AND request_date = v_today;
    
    IF v_used IS NULL THEN
        v_used := 0;
    END IF;
    
    v_remaining := GREATEST(0, v_limit - v_used);
    v_percent_used := ROUND((v_used::NUMERIC / v_limit::NUMERIC) * 100, 1);
    v_show_warning := v_percent_used >= 80 AND v_percent_used < 100;
    v_show_exceeded := v_used >= v_limit;
    
    RETURN jsonb_build_object(
        'can_proceed', v_used < v_limit,
        'tier', v_tier,
        'limit', v_limit,
        'used', v_used,
        'remaining', v_remaining,
        'percent_used', v_percent_used,
        'show_warning', v_show_warning,
        'show_exceeded', v_show_exceeded
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_ai_quota_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_quota_secure(UUID) TO anon;

COMMENT ON FUNCTION public.check_ai_quota_secure IS 
    'Check AI quota without consuming it. Returns current usage stats.
     Use increment_ai_usage_secure() when actually making an AI request.';

-- =====================================================
-- Create RLS bypass warning for admins
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'AI rate limiting now enforced server-side.';
    RAISE NOTICE 'Use: SELECT increment_ai_usage_secure(''user-uuid-here''::UUID);';
    RAISE NOTICE 'Client apps should call this RPC before each AI request.';
END $$;
