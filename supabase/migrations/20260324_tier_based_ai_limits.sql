-- Migration: Update AI Usage Tracking for Tier-Based Limits
-- Created: 2026-03-24
-- Purpose: Replace hardcoded limits with tier-based quotas

-- Update the ai_usage table comments
COMMENT ON TABLE ai_usage IS 'Tracks daily AI request usage per user with tier-based limits. Free: 50/day, Pro: 500/day, Concierge: Unlimited';

-- Update the default requests_limit to 50 (free tier)
ALTER TABLE ai_usage ALTER COLUMN requests_limit SET DEFAULT 50;

-- Create function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT subscription_tier INTO v_tier
    FROM users
    WHERE id = p_user_id;
    
    RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get tier-based AI limit
CREATE OR REPLACE FUNCTION get_tier_ai_limit(p_tier TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_tier
        WHEN 'concierge' THEN NULL  -- Unlimited (NULL)
        WHEN 'pro' THEN 500
        ELSE 50  -- free
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create updated function to check AI quota with tier support
CREATE OR REPLACE FUNCTION check_ai_quota_available(
    p_user_id UUID
)
RETURNS TABLE (
    used INTEGER,
    limit_val INTEGER,
    remaining INTEGER,
    tier TEXT,
    is_unlimited BOOLEAN,
    can_proceed BOOLEAN,
    percent_used NUMERIC
) AS $$
DECLARE
    v_used INTEGER;
    v_tier TEXT;
    v_limit INTEGER;
    v_remaining INTEGER;
    v_is_unlimited BOOLEAN;
    v_can_proceed BOOLEAN;
    v_percent_used NUMERIC;
BEGIN
    -- Get user's tier
    v_tier := get_user_tier(p_user_id);
    
    -- Get tier limit
    v_limit := get_tier_ai_limit(v_tier);
    v_is_unlimited := (v_limit IS NULL);
    
    -- Get usage from last 24 hours
    SELECT COALESCE(SUM(requests_used), 0)
    INTO v_used
    FROM ai_usage
    WHERE user_id = p_user_id
      AND last_request_at >= (NOW() - INTERVAL '24 hours');
    
    -- Calculate remaining and proceed status
    IF v_is_unlimited THEN
        v_remaining := NULL;  -- Unlimited
        v_can_proceed := TRUE;
        v_percent_used := 0;
    ELSE
        v_remaining := GREATEST(0, v_limit - v_used);
        v_can_proceed := v_used < v_limit;
        v_percent_used := LEAST(100, (v_used::NUMERIC / v_limit) * 100);
    END IF;
    
    RETURN QUERY SELECT v_used, v_limit, v_remaining, v_tier, v_is_unlimited, v_can_proceed, v_percent_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get AI usage status for UI
CREATE OR REPLACE FUNCTION get_ai_usage_status(p_user_id UUID)
RETURNS TABLE (
    used INTEGER,
    limit_val INTEGER,
    remaining INTEGER,
    tier TEXT,
    is_unlimited BOOLEAN,
    can_proceed BOOLEAN,
    percent_used NUMERIC,
    show_warning BOOLEAN,
    show_exceeded BOOLEAN,
    next_reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_used INTEGER;
    v_tier TEXT;
    v_limit INTEGER;
    v_remaining INTEGER;
    v_is_unlimited BOOLEAN;
    v_can_proceed BOOLEAN;
    v_percent_used NUMERIC;
    v_show_warning BOOLEAN;
    v_show_exceeded BOOLEAN;
    v_oldest_request TIMESTAMP WITH TIME ZONE;
    v_next_reset TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get quota info
    SELECT * INTO v_used, v_limit, v_remaining, v_tier, v_is_unlimited, v_can_proceed, v_percent_used
    FROM check_ai_quota_available(p_user_id);
    
    -- Determine warning states
    v_show_warning := (NOT v_is_unlimited) AND (v_percent_used >= 80) AND (v_percent_used < 100);
    v_show_exceeded := (NOT v_is_unlimited) AND (v_used >= v_limit);
    
    -- Calculate next reset time
    SELECT MIN(last_request_at)
    INTO v_oldest_request
    FROM ai_usage
    WHERE user_id = p_user_id
      AND last_request_at >= (NOW() - INTERVAL '24 hours');
    
    IF v_oldest_request IS NULL THEN
        v_next_reset := NOW() + INTERVAL '24 hours';
    ELSE
        v_next_reset := v_oldest_request + INTERVAL '24 hours';
    END IF;
    
    RETURN QUERY SELECT v_used, v_limit, v_remaining, v_tier, v_is_unlimited, v_can_proceed, v_percent_used, v_show_warning, v_show_exceeded, v_next_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update subscription_plans table to include max_ai_requests_daily if not exists
DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'max_ai_requests_daily'
    ) THEN
        -- Add the column
        ALTER TABLE subscription_plans ADD COLUMN max_ai_requests_daily INTEGER;
    END IF;
END $$;

-- Insert or update subscription plans with AI limits
INSERT INTO subscription_plans (
    stripe_price_id,
    stripe_product_id,
    name,
    slug,
    description,
    tier,
    billing_interval,
    price_amount,
    currency,
    max_units,
    max_properties,
    max_ai_requests_daily,
    storage_limit_gb,
    features,
    is_active,
    display_order
) VALUES (
    'price_free',
    'prod_free',
    'Free',
    'free',
    'Free plan with basic features - 50 AI requests/day',
    'free',
    'monthly',
    0,
    'usd',
    3,
    1,
    50,
    1,
    '{"ai_assistant": true, "basic_analytics": true, "email_support": false}'::jsonb,
    true,
    1
), (
    'price_pro_monthly',
    'prod_pro',
    'Pro',
    'pro',
    'Pro plan with advanced features - 500 AI requests/day',
    'pro',
    'monthly',
    2900,
    'usd',
    20,
    5,
    500,
    10,
    '{"ai_assistant": true, "advanced_analytics": true, "priority_support": true, "api_access": true}'::jsonb,
    true,
    2
), (
    'price_concierge_monthly',
    'prod_concierge',
    'Concierge',
    'concierge',
    'Concierge plan with unlimited features and dedicated support',
    'concierge',
    'monthly',
    9900,
    'usd',
    NULL, -- unlimited
    NULL, -- unlimited
    NULL, -- unlimited (NULL = Infinity)
    NULL, -- unlimited
    '{"ai_assistant": true, "advanced_analytics": true, "priority_support": true, "api_access": true, "dedicated_support": true, "custom_integrations": true}'::jsonb,
    true,
    3
)
ON CONFLICT (slug) DO UPDATE SET
    max_ai_requests_daily = EXCLUDED.max_ai_requests_daily,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tier(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_tier_ai_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_ai_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_ai_quota_available(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_quota_available(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_ai_usage_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_status(UUID) TO anon;
