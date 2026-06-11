-- Migration: Create economy_settings table
BEGIN;

CREATE TABLE IF NOT EXISTS public.economy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.economy_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage economy settings"
    ON public.economy_settings FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'admin'));

CREATE POLICY "Users can read economy settings"
    ON public.economy_settings FOR SELECT
    TO authenticated
    USING (true);

COMMIT;
