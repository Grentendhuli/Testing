-- Migration: Add AI Usage Tracking Table
-- Created: 2026-03-24
-- Purpose: Track daily AI request usage per user with tier-based limits

-- Create ai_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    requests_used INTEGER NOT NULL DEFAULT 0,
    requests_limit INTEGER NOT NULL DEFAULT 50,
    last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one record per user per day
    UNIQUE(user_id, request_date)
);

-- Create index for efficient quota checks
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, request_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_last_request ON ai_usage(user_id, last_request_at);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_request_date ON ai_usage(request_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_usage_updated_at ON ai_usage;
CREATE TRIGGER trigger_ai_usage_updated_at
    BEFORE UPDATE ON ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_updated_at();

-- Add RLS policies for ai_usage table
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own AI usage
CREATE POLICY ai_usage_select_own ON ai_usage
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can only insert their own AI usage
CREATE POLICY ai_usage_insert_own ON ai_usage
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own AI usage
CREATE POLICY ai_usage_update_own ON ai_usage
    FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Users can only delete their own AI usage
CREATE POLICY ai_usage_delete_own ON ai_usage
    FOR DELETE
    USING (user_id = auth.uid());

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
    'Free plan with basic features',
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
    'Pro plan with advanced features',
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
    updated_at = NOW();

-- Add comment explaining the AI limits
COMMENT ON TABLE ai_usage IS 'Tracks daily AI request usage per user. Resets every 24 hours from first request.';
COMMENT ON COLUMN ai_usage.requests_limit IS 'Daily limit based on subscription tier: free=50, pro=500, concierge=unlimited';
COMMENT ON COLUMN ai_usage.requests_used IS 'Number of AI requests made in the 24-hour window';
COMMENT ON COLUMN ai_usage.last_request_at IS 'Timestamp of the most recent AI request for rolling window calculation';

-- Create a function to get AI usage for a user (for use in policies or views)
CREATE OR REPLACE FUNCTION get_user_ai_usage(p_user_id UUID)
RETURNS TABLE (
    used INTEGER,
    limit_amount INTEGER,
    remaining INTEGER,
    tier TEXT
) AS $$
DECLARE
    v_tier TEXT;
    v_limit INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    -- Get user's tier
    SELECT subscription_tier INTO v_tier
    FROM users
    WHERE id = p_user_id;
    
    -- Set limit based on tier
    v_limit := CASE v_tier
        WHEN 'concierge' THEN NULL  -- unlimited
        WHEN 'pro' THEN 500
        ELSE 50  -- free
    END;
    
    -- Get usage in last 24 hours
    SELECT COALESCE(SUM(requests_used), 0) INTO v_used
    FROM ai_usage
    WHERE user_id = p_user_id
    AND last_request_at >= NOW() - INTERVAL '24 hours';
    
    -- Calculate remaining
    v_remaining := CASE 
        WHEN v_limit IS NULL THEN NULL  -- unlimited
        ELSE GREATEST(0, v_limit - v_used)
    END;
    
    RETURN QUERY SELECT v_used, v_limit, v_remaining, v_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_ai_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ai_usage(UUID) TO anon;
