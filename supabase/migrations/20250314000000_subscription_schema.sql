-- Migration: Complete Subscription System
-- Date: March 14, 2026
-- Description: Creates all tables, indexes, and policies for LandlordBot subscription system

-- ============================================
-- 1. SUBSCRIPTION PLANS (Configuration)
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,
  stripe_product_id text NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  tier text NOT NULL CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  price_amount integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'usd',
  
  -- Feature limits
  max_units integer,
  max_properties integer,
  max_ai_requests_daily integer,
  storage_limit_gb integer,
  
  -- Feature flags
  features jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable" 
  ON subscription_plans FOR SELECT USING (true);

-- Plans can only be modified by service role (no user access)
CREATE POLICY "Plans cannot be modified by users" 
  ON subscription_plans FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- 2. SUBSCRIPTIONS (User Subscriptions)
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  
  -- Stripe IDs
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text NOT NULL,
  
  -- Subscription State
  status text NOT NULL DEFAULT 'incomplete' 
    CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  ended_at timestamptz,
  
  -- Trial
  trial_start timestamptz,
  trial_end timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" 
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Updates only via service role/webhooks
CREATE POLICY "Subscriptions managed by service role" 
  ON subscriptions FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- 3. PAYMENT METHODS
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe IDs
  stripe_payment_method_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  
  -- Card details (non-sensitive)
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  
  -- Status
  is_default boolean DEFAULT false,
  is_valid boolean DEFAULT true,
  
  -- Metadata
  billing_details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for payment_methods
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_pm_id ON payment_methods(stripe_payment_method_id);

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX idx_payment_methods_one_default_per_user 
  ON payment_methods(user_id) WHERE is_default = true;

-- RLS for payment methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods" 
  ON payment_methods FOR SELECT USING (auth.uid() = user_id);

-- Updates via service role only
CREATE POLICY "Payment methods managed by service role" 
  ON payment_methods FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- 4. INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe IDs
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_charge_id text,
  
  -- Invoice Details
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  amount_due integer NOT NULL,
  amount_paid integer DEFAULT 0,
  currency text DEFAULT 'usd',
  
  -- Line Items
  line_items jsonb DEFAULT '[]'::jsonb,
  
  -- Dates
  invoice_date timestamptz NOT NULL,
  due_date timestamptz,
  paid_at timestamptz,
  
  -- URLs
  pdf_url text,
  hosted_invoice_url text,
  
  -- Failure tracking
  attempt_count integer DEFAULT 0,
  next_payment_attempt timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for invoices
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);

-- RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" 
  ON invoices FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Invoices managed by service role" 
  ON invoices FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- 5. SUBSCRIPTION EVENTS (Audit Log)
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type text NOT NULL,
  stripe_event_id text UNIQUE,
  
  -- Payload
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for events
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created ON subscription_events(created_at DESC);
CREATE INDEX idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);

-- RLS for events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" 
  ON subscription_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Events managed by service role" 
  ON subscription_events FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- 6. UPDATE USERS TABLE
-- ============================================

-- Add subscription columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'current_subscription_id') THEN
    ALTER TABLE users ADD COLUMN current_subscription_id uuid REFERENCES subscriptions(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'features_cache') THEN
    ALTER TABLE users ADD COLUMN features_cache jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  -- Ensure subscription_tier exists with proper constraint
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
    ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'free' NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
    ALTER TABLE users ADD COLUMN subscription_status text DEFAULT 'active' NOT NULL;
  END IF;
END $$;

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ============================================
-- 7. SEED DATA: SUBSCRIPTION PLANS
-- ============================================

-- Free Plan (no Stripe integration needed)
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES (
  'free', 'free_product', 'Free', 'free', 'free', 'month', 0, 3, 20, 1,
  '{"basic_analytics": true, "email_support": false, "api_access": false}'::jsonb
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  features = EXCLUDED.features;

-- Starter Monthly (update with your actual Stripe IDs after setup)
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES (
  'price_starter_monthly', 'prod_starter', 'Starter', 'starter-monthly', 'starter', 'month', 1500, 10, 50, 10,
  '{"basic_analytics": true, "email_support": true, "api_access": false}'::jsonb
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_amount = EXCLUDED.price_amount,
  features = EXCLUDED.features;

-- Starter Yearly
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES (
  'price_starter_yearly', 'prod_starter', 'Starter (Yearly)', 'starter-yearly', 'starter', 'year', 14400, 10, 50, 10,
  '{"basic_analytics": true, "email_support": true, "api_access": false}'::jsonb
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_amount = EXCLUDED.price_amount,
  features = EXCLUDED.features;

-- Pro Monthly
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES (
  'price_pro_monthly', 'prod_pro', 'Pro', 'pro-monthly', 'pro', 'month', 2900, null, 100, 50,
  '{"advanced_analytics": true, "priority_support": true, "api_access": true, "custom_integrations": false}'::jsonb
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_amount = EXCLUDED.price_amount,
  features = EXCLUDED.features;

-- Pro Yearly
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES (
  'price_pro_yearly', 'prod_pro', 'Pro (Yearly)', 'pro-yearly', 'pro', 'year', 27800, null, 100, 50,
  '{"advanced_analytics": true, "priority_support": true, "api_access": true, "custom_integrations": false}'::jsonb
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_amount = EXCLUDED.price_amount,
  features = EXCLUDED.features;

-- Enterprise Monthly
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES (
  'price_enterprise_monthly', 'prod_enterprise', 'Enterprise', 'enterprise-monthly', 'enterprise', 'month', 9900, null, null, 500,
  '{"everything_in_pro": true, "dedicated_support": true, "sla": true, "custom_development": true}'::jsonb
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_amount = EXCLUDED.price_amount,
  features = EXCLUDED.features;

-- ============================================
-- 8. TRIGGERS: AUTO-UPDATE TIMESTAMPS
-- ============================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
DO $$
DECLARE
  tables text[] := ARRAY['subscription_plans', 'subscriptions', 'payment_methods', 'invoices'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Get user's current plan limits
CREATE OR REPLACE FUNCTION get_user_limits(user_uuid uuid)
RETURNS TABLE (
  max_units integer,
  max_ai_requests_daily integer,
  storage_limit_gb integer,
  tier text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(sp.max_units, 3) as max_units,
    COALESCE(sp.max_ai_requests_daily, 20) as max_ai_requests_daily,
    COALESCE(sp.storage_limit_gb, 1) as storage_limit_gb,
    COALESCE(u.subscription_tier, 'free') as tier
  FROM users u
  LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
  LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can add more units
CREATE OR REPLACE FUNCTION can_add_unit(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_units integer;
  max_units_allowed integer;
BEGIN
  -- Get current unit count
  SELECT COUNT(*) INTO current_units FROM units WHERE user_id = user_uuid;
  
  -- Get max allowed
  SELECT get_user_limits.max_units INTO max_units_allowed FROM get_user_limits(user_uuid);
  
  -- Return true if unlimited (null) or under limit
  RETURN max_units_allowed IS NULL OR current_units < max_units_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. COMMENTS
-- ============================================

COMMENT ON TABLE subscription_plans IS 'Configuration table for subscription tiers and pricing';
COMMENT ON TABLE subscriptions IS 'User subscription records synced from Stripe';
COMMENT ON TABLE payment_methods IS 'User payment methods from Stripe (non-sensitive data only)';
COMMENT ON TABLE invoices IS 'Billing invoices synced from Stripe';
COMMENT ON TABLE subscription_events IS 'Audit log for subscription lifecycle events';

-- Migration complete
SELECT 'Subscription schema migration completed successfully' AS status;
