-- Migration: Add RLS policies for user_settings, user_feedback, and bot_settings tables
-- Created: 2026-03-24
-- Description: Creates tables with RLS policies for user preferences, feedback, and bot configuration

-- =====================================================
-- user_settings: User preferences and application settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ai_tone text,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  theme text DEFAULT 'light',
  language text DEFAULT 'en',
  timezone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_settings IS 'Stores user preferences including AI tone, notifications, theme, and language settings';

-- =====================================================
-- user_feedback: User feedback submissions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open',
  rating integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create/view their own feedback"
  ON public.user_feedback FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_feedback IS 'Stores user feedback submissions including bug reports, feature requests, and ratings';

-- =====================================================
-- bot_settings: Telegram bot configuration per user
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bot_token text,
  webhook_url text,
  is_active boolean DEFAULT false,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_settings_user_id ON bot_settings(user_id);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their bot settings"
  ON public.bot_settings FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.bot_settings IS 'Stores Telegram bot configuration and webhook settings per user';

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
DROP TRIGGER IF EXISTS update_bot_settings_updated_at ON public.bot_settings;

-- Create triggers
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
