-- Telegram Monetization Engine: sponsored_alerts table
-- Stores sponsored message headers/footers for group alerts

CREATE TABLE IF NOT EXISTS public.sponsored_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'default',
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_alerts_type_active ON public.sponsored_alerts (type, is_active, created_at DESC);

ALTER TABLE public.sponsored_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to sponsored_alerts" ON public.sponsored_alerts
  FOR ALL USING (auth.role() = 'service_role');
