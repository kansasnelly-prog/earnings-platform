-- Module: telemetry_events
-- Description: Unified telemetry event schema for platform analytics and audit logging
-- Supports: Optimization Platform, TikTok6 Matchmaking, Cinema/Sora Media Engine

CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('optimization', 'tiktok6', 'cinema', 'system', 'executive')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  correlation_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter'))
);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_category ON public.telemetry_events(event_category);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_created_at ON public.telemetry_events(created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_user_id ON public.telemetry_events(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_correlation_id ON public.telemetry_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_payload ON public.telemetry_events USING GIN (payload);

COMMENT ON TABLE public.telemetry_events IS 'Unified telemetry event bus for all platform modules';
