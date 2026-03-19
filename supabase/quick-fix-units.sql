-- ════════════════════════════════════════════════════════════════
-- QUICK FIX: Update all users to unlimited units
-- Run this in Supabase SQL Editor if users still have max_units = 1
-- ════════════════════════════════════════════════════════════════

-- 1. See current status
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN max_units = -1 THEN 1 END) as unlimited_users,
    COUNT(CASE WHEN max_units = 1 THEN 1 END) as limited_users,
    COUNT(CASE WHEN max_units = 3 THEN 1 END) as free_tier_users
FROM public.users;

-- 2. Update ALL users to unlimited (-1)
UPDATE public.users 
SET max_units = -1 
WHERE max_units IN (1, 3);

-- 3. Verify fix
SELECT id, email, max_units, subscription_tier
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
