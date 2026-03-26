-- ==========================================
-- LandlordBot Database Schema
-- Supabase PostgreSQL
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- PROFILES TABLE (extends auth.users)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  business_name TEXT,
  phone TEXT,
  property_address TEXT,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'mixed')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'scale', 'concierge')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  referred_by TEXT,
  referral_code TEXT UNIQUE,
  ai_usage_count INTEGER DEFAULT 0,
  ai_usage_reset_at TIMESTAMPTZ,
  ai_tier TEXT DEFAULT 'free' CHECK (ai_tier IN ('free', 'pro', 'unlimited')),
  onboarded BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (for webhooks)
CREATE POLICY "Service role has full access" 
  ON public.profiles FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.subscription_tier = 'concierge'
  ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- UNITS TABLE
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
  rent_amount DECIMAL(10,2) NOT NULL,
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

-- RLS for units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own units" 
  ON public.units FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own units" 
  ON public.units FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units" 
  ON public.units FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own units" 
  ON public.units FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index on user_id for faster queries
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

CREATE POLICY "Users can view own leases" 
  ON public.leases FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leases" 
  ON public.leases FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX leases_user_id_idx ON public.leases(user_id);
CREATE INDEX leases_unit_id_idx ON public.leases(unit_id);
CREATE INDEX leases_status_idx ON public.leases(status);

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

CREATE POLICY "Users can view own maintenance requests" 
  ON public.maintenance_requests FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own maintenance requests" 
  ON public.maintenance_requests FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX maintenance_user_id_idx ON public.maintenance_requests(user_id);
CREATE INDEX maintenance_status_idx ON public.maintenance_requests(status);
CREATE INDEX maintenance_priority_idx ON public.maintenance_requests(priority);

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

CREATE POLICY "Users can view own payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payments" 
  ON public.payments FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_unit_id_idx ON public.payments(unit_id);
CREATE INDEX payments_date_idx ON public.payments(payment_date);

-- ==========================================
-- LEADS TABLE (Incoming Tenant Inquiries)
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

CREATE POLICY "Users can view own leads" 
  ON public.leads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leads" 
  ON public.leads FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX leads_user_id_idx ON public.leads(user_id);
CREATE INDEX leads_status_idx ON public.leads(status);
CREATE INDEX leads_source_idx ON public.leads(source);

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

CREATE POLICY "Users can view own expenses" 
  ON public.expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own expenses" 
  ON public.expenses FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX expenses_category_idx ON public.expenses(category);
CREATE INDEX expenses_date_idx ON public.expenses(expense_date);

-- ==========================================
-- AI USAGE TRACKING TABLE
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
CREATE INDEX ai_usage_created_at_idx ON public.ai_usage(created_at);

-- ==========================================
-- WEBHOOK EVENTS TABLE (Stripe, etc)
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

-- RLS: Service role only
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhooks" 
  ON public.webhook_events FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to get subscription limits
CREATE OR REPLACE FUNCTION public.get_subscription_limits(tier TEXT)
RETURNS TABLE (
  max_units INTEGER,
  max_ai_requests INTEGER,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE tier
      WHEN 'free' THEN 3
      WHEN 'pro' THEN 25
      WHEN 'scale' THEN 100
      WHEN 'concierge' THEN 999999
      ELSE 3
    END,
    CASE tier
      WHEN 'free' THEN 50
      WHEN 'pro' THEN 500
      WHEN 'scale' THEN 999999
      WHEN 'concierge' THEN 999999
      ELSE 50
    END,
    CASE tier
      WHEN 'free' THEN '["basic", "ai_chat"]'::JSONB
      WHEN 'pro' THEN '["basic", "ai_chat", "analytics", "advanced_reports"]'::JSONB
      WHEN 'scale' THEN '["basic", "ai_chat", "analytics", "advanced_reports", "priority_support", "api_access"]'::JSONB
      WHEN 'concierge' THEN '["all"]'::JSONB
      ELSE '["basic"]'::JSONB
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to reset AI usage monthly
CREATE OR REPLACE FUNCTION public.reset_ai_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET ai_usage_count = 0,
      ai_usage_reset_at = NOW()
  WHERE ai_usage_reset_at < DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
     OR ai_usage_reset_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- HANDLE NEW USER SIGNUP
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referral_code TEXT;
BEGIN
  -- Generate unique referral code
  referral_code := 'REF' || UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  
  INSERT INTO public.profiles (
    id,
    email,
    referral_code,
    ai_usage_reset_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    referral_code,
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- GRANTS
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Service role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Enable realtime for tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
