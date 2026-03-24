-- Migration: Create Missing Leases and Messages Tables
-- Created: 2026-03-24
-- Description: Creates leases and messages tables that the app expects but don't exist

-- ============================================
-- 1. LEASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  unit_number TEXT,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  lease_type TEXT DEFAULT 'fixed-term' CHECK (lease_type IN ('fixed-term', 'month-to-month', 'week-to-week')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leases
CREATE INDEX IF NOT EXISTS idx_leases_user_id ON public.leases(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON public.leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_leases_end_date ON public.leases(end_date);
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);

-- RLS for leases
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own leases" 
  ON public.leases FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- 2. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_phone TEXT,
  tenant_name TEXT,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  direction TEXT DEFAULT 'incoming' CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded')),
  requires_escalation BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  ai_response TEXT,
  landlord_responded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_landlord_user_id ON public.messages(landlord_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_phone ON public.messages(tenant_phone);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages" 
  ON public.messages FOR ALL 
  USING (auth.uid() = landlord_user_id);

-- ============================================
-- 3. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_leases_updated_at 
  BEFORE UPDATE ON public.leases 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_messages_updated_at 
  BEFORE UPDATE ON public.messages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. COMMENTS
-- ============================================
COMMENT ON TABLE public.leases IS 'Tenant lease agreements linked to units';
COMMENT ON TABLE public.messages IS 'Messages between landlords and tenants via Telegram bot';

-- Migration complete
SELECT 'Leases and Messages tables created successfully' AS status;
