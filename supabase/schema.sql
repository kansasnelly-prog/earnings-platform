-- SREYMARA MASTER DUAL-PIPELINE & FINANCIAL INFRASTRUCTURE SCHEMA

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Multi-Chain Wallet Profile Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  usdt_balance NUMERIC(18, 4) DEFAULT 12450.0000,
  sol_balance NUMERIC(18, 4) DEFAULT 76.8000,
  usdc_balance NUMERIC(18, 4) DEFAULT 5200.0000,
  eth_balance NUMERIC(18, 4) DEFAULT 4.2500,
  country_code VARCHAR(3) DEFAULT 'USA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dual-Pipeline Ad Tracking Table (SSP/DSP)
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  pipeline_type VARCHAR(20) CHECK (pipeline_type IN ('WEB2_SSP', 'WEB3_DSP')),
  source_module VARCHAR(50) CHECK (source_module IN ('CINEMA_STREAMING', 'AI_CHAT', 'IN_APP_BANNER', 'FLOATING_BANNER', 'MATCH_SUITE')),
  cpm_earned NUMERIC(12, 6) NOT NULL,
  country_code VARCHAR(3) NOT NULL DEFAULT 'USA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-Bank & Virtual Card Payout Destinations (BaaS)
CREATE TABLE IF NOT EXISTS public.payout_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  swift_bic TEXT,
  provider VARCHAR(30) CHECK (provider IN ('ZENUS_BANK', 'AIRWALLEX', 'ADYEN_GLOBAL', 'RAPYD_PAYOUT', 'TIPALTI')),
  is_active_toggle BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solana & Multi-Chain to USDT Settlement Log
CREATE TABLE IF NOT EXISTS public.token_exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  sol_amount NUMERIC(18, 6) NOT NULL,
  usdt_received NUMERIC(18, 4) NOT NULL,
  exchange_rate NUMERIC(12, 4) NOT NULL,
  tx_hash TEXT NOT NULL,
  settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct Multi-Chain Payout Events Ledger
CREATE TABLE IF NOT EXISTS public.direct_yield_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  currency VARCHAR(10) NOT NULL, -- 'USDT', 'USDC', 'ETH', 'SOL'
  network VARCHAR(30) NOT NULL,  -- 'USDT_TRC20', 'ERC20', 'TON', 'POLYGON', 'SOLANA'
  amount_added NUMERIC(18, 6) NOT NULL,
  cpm_yield NUMERIC(12, 4),
  source_trigger TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
