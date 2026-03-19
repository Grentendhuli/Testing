-- Migration: AI Usage Tracking Table
-- Created: 2026-03-14
-- Description: Tracks AI request usage per user with rolling 24h window

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS ai_usage (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    requests_used INTEGER NOT NULL DEFAULT 0,
    requests_limit INTEGER NOT NULL DEFAULT 20,
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite primary key
    PRIMARY KEY (user_id, request_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_request_date ON ai_usage(request_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_last_request_at ON ai_usage(last_request_at);

-- Add comment for documentation
COMMENT ON TABLE ai_usage IS 'Tracks AI request usage per user with rolling 24h window. Free tier: 20 requests/day hard limit, 25 soft limit with warning.';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_ai_usage_updated_at ON ai_usage;
CREATE TRIGGER trigger_ai_usage_updated_at
    BEFORE UPDATE ON ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_updated_at();

-- Create function to get rolling 24h usage count
CREATE OR REPLACE FUNCTION get_rolling_24h_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(requests_used), 0)
    INTO v_count
    FROM ai_usage
    WHERE user_id = p_user_id
      AND last_request_at >= (NOW() - INTERVAL '24 hours');
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has AI quota available
CREATE OR REPLACE FUNCTION check_ai_quota_available(
    p_user_id UUID,
    p_hard_limit INTEGER DEFAULT 20,
    p_soft_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
    used INTEGER,
    limit_val INTEGER,
    remaining INTEGER,
    is_soft_limit BOOLEAN,
    can_proceed BOOLEAN
) AS $$
DECLARE
    v_used INTEGER;
    v_limit INTEGER;
    v_remaining INTEGER;
    v_is_soft BOOLEAN;
    v_can_proceed BOOLEAN;
BEGIN
    -- Get usage from last 24 hours
    SELECT COALESCE(SUM(requests_used), 0)
    INTO v_used
    FROM ai_usage
    WHERE user_id = p_user_id
      AND last_request_at >= (NOW() - INTERVAL '24 hours');
    
    -- Determine limit based on current usage
    IF v_used >= p_hard_limit THEN
        v_limit := p_soft_limit;
        v_is_soft := TRUE;
    ELSE
        v_limit := p_hard_limit;
        v_is_soft := FALSE;
    END IF;
    
    v_remaining := GREATEST(0, v_limit - v_used);
    v_can_proceed := v_used < p_soft_limit;
    
    RETURN QUERY SELECT v_used, v_limit, v_remaining, v_is_soft, v_can_proceed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for ai_usage table
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY ai_usage_select_own ON ai_usage
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can only insert their own usage
CREATE POLICY ai_usage_insert_own ON ai_usage
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own usage
CREATE POLICY ai_usage_update_own ON ai_usage
    FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Service role can manage all usage (for edge functions)
CREATE POLICY ai_usage_service_all ON ai_usage
    FOR ALL
    USING (auth.role() = 'service_role');
