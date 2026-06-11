-- Migration: Create TikTok-style Coin Economy Tables
-- Date: 2026-06-10

-- 1. Coin Packages Table
CREATE TABLE IF NOT EXISTS public.coin_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price_usd NUMERIC NOT NULL,
    coin_amount INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Coin Ledger Table
CREATE TABLE IF NOT EXISTS public.user_coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'purchase', 'reward', 'gift', 'fee_deduction', 'premium_unlock'
    amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 3. Platform Configuration Table (Singleton)
CREATE TABLE IF NOT EXISTS public.platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coin_reward_rate NUMERIC DEFAULT 1.0,
    creator_payout_rate NUMERIC DEFAULT 0.5, -- 50% payout
    package_settings JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial config
INSERT INTO public.platform_config (coin_reward_rate, creator_payout_rate) VALUES (1.0, 0.5);
