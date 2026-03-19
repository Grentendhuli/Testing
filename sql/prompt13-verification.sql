-- PROMPT 13: SQL Verification Queries for LandlordBot
-- Run these in the Supabase SQL Editor to verify database schema

-- Step 1: Verify all expected tables exist
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables: leads, leases, maintenance_requests, messages, payments, units, users

-- Step 2: Verify payments constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%payment%';

-- Expected: status IN ('pending','paid','overdue','cancelled','failed','late')

-- Step 3: Verify users have correct max_units
SELECT COUNT(*) as needs_fix 
FROM public.users 
WHERE max_units != -1;

-- If result > 0, run:
-- UPDATE public.users SET max_units = -1 WHERE max_units != -1;

-- Step 4: Add listing defaults columns if missing
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS listing_laundry TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS listing_pets TEXT DEFAULT 'not_allowed',
  ADD COLUMN IF NOT EXISTS listing_heat_included BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS listing_parking BOOLEAN DEFAULT FALSE;

-- Step 5: Final verification - count rows in all tables
SELECT 'users' AS table_name, COUNT(*) as row_count FROM public.users
UNION ALL SELECT 'units', COUNT(*) FROM public.units
UNION ALL SELECT 'leases', COUNT(*) FROM public.leases
UNION ALL SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL SELECT 'maintenance_requests', COUNT(*) FROM public.maintenance_requests
UNION ALL SELECT 'leads', COUNT(*) FROM public.leads;

-- Step 6: Verify bot_phone_number column exists (for Telegram bot)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'bot_phone_number';

-- Step 7: Check for any missing required columns on users table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'email', 'first_name', 'last_name', 'property_address', 'bot_phone_number', 'subscription_tier', 'subscription_status', 'max_units');
