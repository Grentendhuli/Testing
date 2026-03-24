-- Migration: Fix Users Table RLS Policies
-- Created: 2026-03-24
-- Description: Adds INSERT policy for users table and fixes update issues

-- ============================================
-- 1. DROP EXISTING POLICIES TO RECREATE
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- ============================================
-- 2. RECREATE RLS POLICIES FOR USERS TABLE
-- ============================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (important for signup flow)
CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role can manage all users" 
  ON public.users FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. ENSURE RLS IS ENABLED
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;

-- Migration complete
SELECT 'Users table RLS policies fixed successfully' AS status;
