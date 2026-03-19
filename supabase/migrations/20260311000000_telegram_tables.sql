-- Telegram tenant linking table
CREATE TABLE IF NOT EXISTS telegram_tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id text NOT NULL UNIQUE,
  unit_code text,
  tenant_name text,
  phone_number text,
  landlord_user_id uuid REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  is_active boolean DEFAULT true
);

-- Landlord bot configuration table
CREATE TABLE IF NOT EXISTS landlord_telegram (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) NOT NULL UNIQUE,
  bot_token text,
  bot_username text,
  webhook_url text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_tenants_chat ON telegram_tenants(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_tenants_unit ON telegram_tenants(unit_code);
CREATE INDEX IF NOT EXISTS idx_telegram_tenants_landlord ON telegram_tenants(landlord_user_id);

-- RLS policies
ALTER TABLE telegram_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_telegram ENABLE ROW LEVEL SECURITY;

-- Landlords can only see their own tenants
CREATE POLICY "Landlords can view their tenants" ON telegram_tenants
  FOR SELECT USING (landlord_user_id = auth.uid());

-- Landlords can only see their own bot config
CREATE POLICY "Landlords can manage their bot" ON landlord_telegram
  FOR ALL USING (user_id = auth.uid());
