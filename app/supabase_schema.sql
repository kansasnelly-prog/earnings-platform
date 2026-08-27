-- =========================================================================
-- MASTER EXECUTIVE WEB2/WEB3 TELEGRAM ECOSYSTEM SUPABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor (https://app.supabase.com)
-- =========================================================================

-- 1. Create Users & Telegram Account Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  first_name TEXT,
  master_wallet_address TEXT,
  balance_usd NUMERIC(12, 2) DEFAULT 128.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Master Cinema Safe Pot Table ($0.10/min earnings -> $50 alert)
CREATE TABLE IF NOT EXISTS public.cinema_safe_pot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  master_owner_telegram_id BIGINT,
  pot_balance_usd NUMERIC(10, 2) DEFAULT 18.50,
  target_threshold_usd NUMERIC(10, 2) DEFAULT 50.00,
  is_streaming_active BOOLEAN DEFAULT FALSE,
  last_yield_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_withdrawn_usd NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Solana 2-Hour Drip Vault Claims Table
CREATE TABLE IF NOT EXISTS public.drip_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  master_wallet_address TEXT NOT NULL,
  tokens_minted NUMERIC(10, 2) DEFAULT 250.00,
  sol_reward NUMERIC(8, 4) DEFAULT 0.05,
  usd_value NUMERIC(10, 2) DEFAULT 12.50,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Token Swap Transactions Table
CREATE TABLE IF NOT EXISTS public.token_swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT,
  from_asset TEXT NOT NULL,
  from_amount NUMERIC(12, 4) NOT NULL,
  to_asset TEXT NOT NULL,
  to_amount_result TEXT NOT NULL,
  master_wallet_address TEXT NOT NULL,
  solana_tx_signature TEXT UNIQUE,
  swapped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_safe_pot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_swaps ENABLE ROW LEVEL SECURITY;

-- Allow Public Access (For Telegram Web App Demo / Vercel Serverless Sync)
CREATE POLICY "Allow public read/write access" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public read/write access" ON public.cinema_safe_pot FOR ALL USING (true);
CREATE POLICY "Allow public read/write access" ON public.drip_claims FOR ALL USING (true);
CREATE POLICY "Allow public read/write access" ON public.token_swaps FOR ALL USING (true);
