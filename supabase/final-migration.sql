-- ════════════════════════════════════════════════════════════════════
-- LANDLORD BOT DATA MIGRATION
-- Run this AFTER all code prompts are deployed
-- Fixes existing users with wrong max_units, migrates lease data
-- ════════════════════════════════════════════════════════════════════

-- 1. Fix existing users who got max_units = 1 from old trigger
-- Sets to -1 (unlimited) for proper subscription handling
UPDATE public.users 
SET max_units = -1, updated_at = NOW() 
WHERE max_units != -1;

-- 2. Migrate lease data from units table into new leases table
-- Creates real lease records for units that have tenant data embedded
INSERT INTO public.leases (
    user_id,
    unit_id,
    unit_number,
    tenant_name,
    tenant_email,
    tenant_phone,
    start_date,
    end_date,
    rent_amount,
    status
)
SELECT 
    u.user_id,
    u.id,
    COALESCE(u.unit_number, ''),
    u.tenant_name,
    u.tenant_email,
    u.tenant_phone,
    COALESCE(u.lease_start, NOW()::DATE),
    COALESCE(u.lease_end, (NOW() + INTERVAL '1 year')::DATE),
    COALESCE(u.rent_amount, 0),
    CASE 
        WHEN u.lease_end IS NOT NULL AND u.lease_end < NOW()::DATE THEN 'expired' 
        ELSE 'active' 
    END
FROM public.units u
WHERE u.tenant_name IS NOT NULL 
    AND u.tenant_name != ''
    AND NOT EXISTS (
        SELECT 1 FROM public.leases l WHERE l.unit_id = u.id
    );

-- 3. Verify counts
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM public.users
UNION ALL
SELECT 'units', COUNT(*) FROM public.units
UNION ALL
SELECT 'leases', COUNT(*) FROM public.leases
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'maintenance_requests', COUNT(*) FROM public.maintenance_requests
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
ORDER BY table_name;
