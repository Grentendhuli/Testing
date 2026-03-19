-- ═════════════════════════════════════════════════════════════
-- LANDLORDBOT SCHEMA FIX — Run in Supabase SQL Editor (LIVE)
-- ═════════════════════════════════════════════════════════════

-- 1. Create leases table (was missing entirely)
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  lease_type TEXT DEFAULT 'fixed-term' CHECK (lease_type IN ('fixed-term','month-to-month','rent-stabilized')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','terminated','renewed','expiring')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_user_id ON public.leases(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON public.leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_leases_end_date ON public.leases(end_date);

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own leases" 
  ON public.leases 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE TRIGGER update_leases_updated_at 
  BEFORE UPDATE ON public.leases 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Fix payments table — add 'failed' and 'late' as valid statuses
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending','paid','overdue','cancelled','failed','late'));

-- 3. Fix handle_new_user trigger — set max_units to -1 (unlimited)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    subscription_tier,
    subscription_status,
    max_units,
    storage_used,
    storage_limit
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'free',
    'active',
    -1,  -- CHANGED: was 3, now -1 (unlimited)
    0,
    1073741824
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create messages table (was missing — needed for Telegram bot messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  telegram_chat_id TEXT,
  sender_name TEXT,
  sender_phone TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' 
    CHECK (type IN ('maintenance','payment','general','emergency','inquiry')),
  source TEXT DEFAULT 'telegram' 
    CHECK (source IN ('telegram','manual','email','sms')),
  landlord_responded BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_landlord ON public.messages(landlord_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage their messages" 
  ON public.messages 
  FOR ALL 
  USING (auth.uid() = landlord_user_id);

-- 5. Add users INSERT policy (needed for OAuth users who aren't in users table yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='users' AND policyname='Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" 
      ON public.users 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- ═════════════════════════════════════════════════════════════
-- VERIFICATION STEPS (Run after above succeeds)
-- ═════════════════════════════════════════════════════════════

-- Check that tables exist:
-- Go to Supabase → Table Editor → Should see: leases, messages

-- Fix existing users to have unlimited units:
UPDATE public.users 
SET max_units = -1 
WHERE max_units = 1 OR max_units = 3;

-- Verify the update:
-- SELECT id, email, max_units FROM public.users LIMIT 5;
