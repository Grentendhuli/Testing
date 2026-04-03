-- Migration: AI Usage Dashboard Admin Functions
-- Created: 2026-03-24
-- Description: Adds admin role support and RPC functions for AI usage dashboard

-- Add role column to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- Create ai_usage_detailed table for more comprehensive tracking
CREATE TABLE IF NOT EXISTS ai_usage_detailed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL DEFAULT 'chat',
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    error_occurred BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    question_category TEXT,
    model_used TEXT DEFAULT 'gemini-2.0-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_detailed_user_id ON ai_usage_detailed(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_detailed_created_at ON ai_usage_detailed(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_detailed_request_type ON ai_usage_detailed(request_type);

-- Enable RLS
ALTER TABLE ai_usage_detailed ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY ai_usage_detailed_select_own ON ai_usage_detailed
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ai_usage_detailed_insert_own ON ai_usage_detailed
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_usage_detailed_admin_all ON ai_usage_detailed
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Function: Get daily AI usage stats
CREATE OR REPLACE FUNCTION get_ai_usage_daily_stats(start_date DATE)
RETURNS TABLE (
    date DATE,
    total_requests BIGINT,
    free_requests BIGINT,
    pro_requests BIGINT,
    concierge_requests BIGINT,
    total_tokens BIGINT,
    estimated_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.request_date::DATE as date,
        COALESCE(SUM(au.requests_used), 0)::BIGINT as total_requests,
        COALESCE(SUM(CASE WHEN u.subscription_tier = 'free' THEN au.requests_used ELSE 0 END), 0)::BIGINT as free_requests,
        COALESCE(SUM(CASE WHEN u.subscription_tier = 'pro' THEN au.requests_used ELSE 0 END), 0)::BIGINT as pro_requests,
        COALESCE(SUM(CASE WHEN u.subscription_tier = 'concierge' THEN au.requests_used ELSE 0 END), 0)::BIGINT as concierge_requests,
        COALESCE(SUM(au.requests_used * 1000), 0)::BIGINT as total_tokens,
        COALESCE(SUM(au.requests_used * 0.0005), 0)::NUMERIC as estimated_cost
    FROM ai_usage au
    JOIN users u ON au.user_id = u.id
    WHERE au.request_date >= start_date
    GROUP BY au.request_date
    ORDER BY au.request_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get today's AI usage stats
CREATE OR REPLACE FUNCTION get_ai_usage_today_stats()
RETURNS TABLE (
    total_requests BIGINT,
    total_cost NUMERIC,
    unique_users BIGINT,
    avg_response_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(au.requests_used), 0)::BIGINT as total_requests,
        COALESCE(SUM(au.requests_used * 0.0005), 0)::NUMERIC as total_cost,
        COUNT(DISTINCT au.user_id)::BIGINT as unique_users,
        COALESCE(AVG(aud.response_time_ms), 0)::NUMERIC as avg_response_time
    FROM ai_usage au
    LEFT JOIN ai_usage_detailed aud ON au.user_id = aud.user_id 
        AND DATE(aud.created_at) = CURRENT_DATE
    WHERE au.request_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top users by AI usage
CREATE OR REPLACE FUNCTION get_ai_usage_top_users(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    tier TEXT,
    request_count BIGINT,
    percent_used NUMERIC,
    is_near_limit BOOLEAN,
    is_at_limit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.subscription_tier as tier,
        COALESCE(SUM(au.requests_used), 0)::BIGINT as request_count,
        CASE 
            WHEN u.subscription_tier = 'free' THEN 
                LEAST(100, (COALESCE(SUM(au.requests_used), 0)::NUMERIC / 50) * 100)
            WHEN u.subscription_tier = 'pro' THEN 
                LEAST(100, (COALESCE(SUM(au.requests_used), 0)::NUMERIC / 500) * 100)
            ELSE 0
        END as percent_used,
        CASE 
            WHEN u.subscription_tier = 'free' AND COALESCE(SUM(au.requests_used), 0) >= 40 THEN TRUE
            WHEN u.subscription_tier = 'pro' AND COALESCE(SUM(au.requests_used), 0) >= 400 THEN TRUE
            ELSE FALSE
        END as is_near_limit,
        CASE 
            WHEN u.subscription_tier = 'free' AND COALESCE(SUM(au.requests_used), 0) >= 50 THEN TRUE
            WHEN u.subscription_tier = 'pro' AND COALESCE(SUM(au.requests_used), 0) >= 500 THEN TRUE
            ELSE FALSE
        END as is_at_limit
    FROM users u
    LEFT JOIN ai_usage au ON u.id = au.user_id 
        AND au.request_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY u.id, u.email, u.first_name, u.last_name, u.subscription_tier
    ORDER BY request_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get users near their AI usage limit
CREATE OR REPLACE FUNCTION get_ai_usage_users_near_limit(threshold_percent NUMERIC DEFAULT 80)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    tier TEXT,
    request_count BIGINT,
    percent_used NUMERIC,
    is_near_limit BOOLEAN,
    is_at_limit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.subscription_tier as tier,
        COALESCE(SUM(au.requests_used), 0)::BIGINT as request_count,
        CASE 
            WHEN u.subscription_tier = 'free' THEN 
                LEAST(100, (COALESCE(SUM(au.requests_used), 0)::NUMERIC / 50) * 100)
            WHEN u.subscription_tier = 'pro' THEN 
                LEAST(100, (COALESCE(SUM(au.requests_used), 0)::NUMERIC / 500) * 100)
            ELSE 0
        END as percent_used,
        TRUE as is_near_limit,
        CASE 
            WHEN u.subscription_tier = 'free' AND COALESCE(SUM(au.requests_used), 0) >= 50 THEN TRUE
            WHEN u.subscription_tier = 'pro' AND COALESCE(SUM(au.requests_used), 0) >= 500 THEN TRUE
            ELSE FALSE
        END as is_at_limit
    FROM users u
    LEFT JOIN ai_usage au ON u.id = au.user_id 
        AND au.request_date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE u.subscription_tier IN ('free', 'pro')
    GROUP BY u.id, u.email, u.first_name, u.last_name, u.subscription_tier
    HAVING 
        CASE 
            WHEN u.subscription_tier = 'free' THEN 
                (COALESCE(SUM(au.requests_used), 0)::NUMERIC / 50) * 100 >= threshold_percent
            WHEN u.subscription_tier = 'pro' THEN 
                (COALESCE(SUM(au.requests_used), 0)::NUMERIC / 500) * 100 >= threshold_percent
            ELSE FALSE
        END
    ORDER BY percent_used DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get model performance stats
CREATE OR REPLACE FUNCTION get_ai_usage_model_performance(start_date DATE)
RETURNS TABLE (
    avg_response_time_ms NUMERIC,
    error_rate NUMERIC,
    avg_tokens_input NUMERIC,
    avg_tokens_output NUMERIC,
    total_errors BIGINT,
    common_question_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(aud.response_time_ms), 0)::NUMERIC as avg_response_time_ms,
        COALESCE(
            (COUNT(CASE WHEN aud.error_occurred THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)), 
            0
        ) as error_rate,
        COALESCE(AVG(aud.tokens_input), 0)::NUMERIC as avg_tokens_input,
        COALESCE(AVG(aud.tokens_output), 0)::NUMERIC as avg_tokens_output,
        COUNT(CASE WHEN aud.error_occurred THEN 1 END)::BIGINT as total_errors,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object('type', category, 'count', cnt) ORDER BY cnt DESC)
                FROM (
                    SELECT question_category as category, COUNT(*) as cnt
                    FROM ai_usage_detailed
                    WHERE created_at >= start_date
                    AND question_category IS NOT NULL
                    GROUP BY question_category
                    ORDER BY cnt DESC
                    LIMIT 5
                ) subq
            ),
            '[]'::jsonb
        ) as common_question_types
    FROM ai_usage_detailed aud
    WHERE aud.created_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get hourly usage for today
CREATE OR REPLACE FUNCTION get_ai_usage_hourly_today()
RETURNS TABLE (
    hour INTEGER,
    requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM aud.created_at)::INTEGER as hour,
        COUNT(*)::BIGINT as requests
    FROM ai_usage_detailed aud
    WHERE DATE(aud.created_at) = CURRENT_DATE
    GROUP BY EXTRACT(HOUR FROM aud.created_at)
    ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get conversion stats (free users who hit limit and upgraded)
CREATE OR REPLACE FUNCTION get_ai_usage_conversion_stats(start_date DATE)
RETURNS TABLE (
    free_users_hit_limit BIGINT,
    free_users_upgraded BIGINT,
    upgrade_rate NUMERIC,
    pro_users_near_concierge BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH users_hit_limit AS (
        SELECT DISTINCT u.id
        FROM users u
        JOIN ai_usage au ON u.id = au.user_id
        WHERE au.request_date >= start_date
        AND u.subscription_tier = 'free'
        GROUP BY u.id
        HAVING SUM(au.requests_used) >= 50
    ),
    users_upgraded AS (
        SELECT DISTINCT u.id
        FROM users u
        JOIN ai_usage au ON u.id = au.user_id
        WHERE au.request_date >= start_date
        AND u.subscription_tier = 'concierge'
        AND EXISTS (
            SELECT 1 FROM ai_usage au2 
            WHERE au2.user_id = u.id 
            AND au2.request_date < au.request_date
            GROUP BY au2.user_id
            HAVING SUM(au2.requests_used) >= 50
        )
    ),
    pro_near_limit AS (
        SELECT DISTINCT u.id
        FROM users u
        JOIN ai_usage au ON u.id = au.user_id
        WHERE au.request_date >= CURRENT_DATE - INTERVAL '30 days'
        AND u.subscription_tier = 'pro'
        GROUP BY u.id
        HAVING SUM(au.requests_used) >= 400
    )
    SELECT 
        (SELECT COUNT(*) FROM users_hit_limit)::BIGINT as free_users_hit_limit,
        (SELECT COUNT(*) FROM users_upgraded)::BIGINT as free_users_upgraded,
        CASE 
            WHEN (SELECT COUNT(*) FROM users_hit_limit) > 0 
            THEN (SELECT COUNT(*)::NUMERIC FROM users_upgraded) / (SELECT COUNT(*) FROM users_hit_limit)
            ELSE 0
        END as upgrade_rate,
        (SELECT COUNT(*) FROM pro_near_limit)::BIGINT as pro_users_near_concierge;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get new AI users this week
CREATE OR REPLACE FUNCTION get_ai_usage_new_users_this_week()
RETURNS TABLE (count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(DISTINCT au.user_id)::BIGINT
    FROM ai_usage au
    WHERE au.created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND NOT EXISTS (
        SELECT 1 FROM ai_usage au2 
        WHERE au2.user_id = au.user_id 
        AND au2.created_at < CURRENT_DATE - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_ai_usage_daily_stats(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_today_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_top_users(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_users_near_limit(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_model_performance(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_hourly_today() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_conversion_stats(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_new_users_this_week() TO authenticated;

-- Create admin user policy for users table
DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
    FOR ALL
    USING (role = 'admin' OR auth.uid() = id);

-- Add comment for documentation
COMMENT ON TABLE ai_usage_detailed IS 'Detailed AI usage tracking with per-request metrics for analytics';
COMMENT ON COLUMN users.role IS 'User role: user or admin. Admins can access the AI usage dashboard.';
