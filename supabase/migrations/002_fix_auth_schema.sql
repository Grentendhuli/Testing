-- ==========================================
-- Fix Auth Schema - Create USERS table (not profiles)
-- Matching the existing app code expectations
-- ==========================================

-- Drop profiles table if exists (we're using users instead)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- USERS TABLE (matching app code expectations)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  property_address TEXT,
  bot_phone_number TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'scale', 'concierge')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  -- Unit/Storage limits
  max_units INTEGER DEFAULT -1, -- -1 = unlimited on free (enforced in app)
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB
  -- Listing defaults
  listing_laundry TEXT,
  listing_pets TEXT,
  listing_heat_included BOOLEAN DEFAULT FALSE,
  listing_parking BOOLEAN DEFAULT FALSE,
  -- Payment handles
  venmo_handle TEXT,
  zelle_contact TEXT,
  cashapp_tag TEXT,
  paypal_handle TEXT,
  preferred_payment_method TEXT,
  -- AI tracking
  ai_usage_count INTEGER DEFAULT 0,
  ai_usage_reset_at TIMESTAMPTZ,
  ai_tier TEXT DEFAULT 'free',
  -- Referral
  referred_by TEXT,
  referral_code TEXT UNIQUE,
  -- Onboarding
  onboarded BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own data
CREATE POLICY "Users can view own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Service role bypasses RLS
CREATE POLICY "Service role has full access" 
  ON public.users FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Indexes
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_subscription_tier_idx ON public.users(subscription_tier);

-- ==========================================
-- UNITS TABLE (matching app expectations)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'New York',
  state TEXT DEFAULT 'NY',
  zip_code TEXT DEFAULT '10001',
  bedrooms INTEGER DEFAULT 1,
  bathrooms NUMERIC(3,1) DEFAULT 1.0,
  square_feet INTEGER,
  rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance', 'unavailable')),
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  lease_start_date DATE,
  lease_end_date DATE,
  security_deposit DECIMAL(10,2),
  hpd_registration_number TEXT,
  rent_stabilized BOOLEAN DEFAULT FALSE,
  notes TEXT,
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  market_rent DECIMAL(10,2),
  last_rent_increase_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own units" 
  ON public.units FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX units_user_id_idx ON public.units(user_id);
CREATE INDEX units_status_idx ON public.units(status);

-- ==========================================
-- LEASES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  monthly_rent DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2),
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  lease_type TEXT DEFAULT 'fixed_term' CHECK (lease_type IN ('fixed_term', 'month_to_month', 'renewal')),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'renewed')),
  document_url TEXT,
  signature_required BOOLEAN DEFAULT FALSE,
  signed_by_tenant BOOLEAN DEFAULT FALSE,
  signed_by_landlord BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leases" 
  ON public.leases FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX leases_user_id_idx ON public.leases(user_id);
CREATE INDEX leases_unit_id_idx ON public.leases(unit_id);

-- ==========================================
-- MAINTENANCE REQUESTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  unit_number TEXT,
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'locksmith', 'pest', 'general', 'emergency')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'deferred')),
  assigned_to TEXT,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  hpd_violation BOOLEAN DEFAULT FALSE,
  hpd_violation_id TEXT,
  ai_triage JSONB,
  images JSONB DEFAULT '[]',
  requested_by TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own maintenance requests" 
  ON public.maintenance_requests FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX maintenance_user_id_idx ON public.maintenance_requests(user_id);
CREATE INDEX maintenance_status_idx ON public.maintenance_requests(status);

-- ==========================================
-- PAYMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  tenant_name TEXT,
  tenant_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT DEFAULT 'rent' CHECK (payment_type IN ('rent', 'security_deposit', 'late_fee', 'utilities', 'other')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'zelle', 'venmo', 'paypal', 'stripe', 'other')),
  payment_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'received' CHECK (status IN ('pending', 'received', 'cleared', 'bounced', 'refunded')),
  memo TEXT,
  receipt_sent BOOLEAN DEFAULT FALSE,
  receipt_number TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payments" 
  ON public.payments FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_date_idx ON public.payments(payment_date);

-- ==========================================
-- LEADS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('website', 'zillow', 'apartments.com', 'craigslist', 'referral', 'manual', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'scheduled', 'applied', 'converted', 'lost')),
  preferred_move_in DATE,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  unit_interest TEXT,
  message TEXT,
  notes TEXT,
  assigned_to TEXT,
  last_contact_date TIMESTAMPTZ,
  converted_to_unit_id UUID REFERENCES public.units(id),
  priority INTEGER DEFAULT 3 CHECK (priority IN (1, 2, 3, 4, 5)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leads" 
  ON public.leads FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX leads_user_id_idx ON public.leads(user_id);

-- ==========================================
-- EXPENSES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'repairs', 'utilities', 'insurance', 'tax', 'marketing', 'legal', 'management', 'capital_improvement', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  deductible BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" 
  ON public.expenses FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX expenses_user_id_idx ON public.expenses(user_id);

-- ==========================================
-- AI USAGE TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('chat', 'triage', 'listing', 'letter', 'general')),
  tokens_used INTEGER,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rate_limited')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage" 
  ON public.ai_usage FOR SELECT 
  USING (auth.uid() = user_id);

CREATE INDEX ai_usage_user_id_idx ON public.ai_usage(user_id);

-- ==========================================
-- WEBHOOK EVENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'supabase', 'other')),
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhooks" 
  ON public.webhook_events FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referral_code TEXT;
BEGIN
  referral_code := 'REF' || UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  
  INSERT INTO public.users (
    id, email, referral_code, created_at, updated_at, storage_limit
  ) VALUES (
    NEW.id, NEW.email, referral_code, NOW(), NOW(), 1073741824
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- GRANTS
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
