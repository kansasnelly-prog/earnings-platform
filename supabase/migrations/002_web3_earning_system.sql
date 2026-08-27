-- SREYMARA Web3 & Telegram Mini App Extension
-- This migration extends the existing schema with web3 earning channels and Telegram-specific tables.

-- ==========================================
-- TELEGRAM USER PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'en',
  is_premium BOOLEAN DEFAULT false,
  stars_balance BIGINT DEFAULT 0,
  ton_wallet TEXT,
  solana_wallet TEXT,
  referred_by UUID REFERENCES public.telegram_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ==========================================
-- WEB3 EARNING STRATEGIES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.earning_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ads', 'task', 'social', 'defi', 'referral', 'streaming', 'ai', 'mini-app', 'staking', 'bonus')),
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('stars', 'ton', 'sol', 'usdt', 'usdc', 'srey', 'points')),
  base_reward NUMERIC(18, 6) NOT NULL DEFAULT 0,
  reward_currency TEXT NOT NULL DEFAULT 'USDT',
  is_active BOOLEAN DEFAULT true,
  requires_telegram BOOLEAN DEFAULT false,
  requires_wallet BOOLEAN DEFAULT false,
  min_level INTEGER DEFAULT 1,
  cooldown_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ==========================================
-- USER EARNING PROGRESS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.earning_strategies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reward_amount NUMERIC(18, 6) NOT NULL DEFAULT 0,
  reward_currency TEXT NOT NULL DEFAULT 'USDT',
  tx_hash TEXT,
  network TEXT CHECK (network IN ('stars', 'adsgram', 'ton', 'solana', 'internal')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, strategy_id, created_at)
);

-- ==========================================
-- WEBHOOK EVENT LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('telegram-stars', 'adsgram', 'ton', 'solana', 'internal')),
  event_type TEXT NOT NULL,
  user_telegram_id BIGINT,
  amount NUMERIC(18, 6),
  currency TEXT,
  tx_hash TEXT,
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ==========================================
-- WALLET BINDINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallet_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('ton', 'solana', 'bsc', 'polygon', 'ethereum')),
  address TEXT NOT NULL,
  public_key TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  bound_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, network, address)
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earning_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_bindings ENABLE ROW LEVEL SECURITY;

-- Telegram users can view their own record
CREATE POLICY "Users can view own telegram record"
  ON public.telegram_users
  FOR SELECT
  USING (telegram_id::text = auth.jwt() ->> 'sub');

-- Strategies are public readable
CREATE POLICY "Strategies are publicly readable"
  ON public.earning_strategies
  FOR SELECT
  USING (true);

-- Users can view their own earnings
CREATE POLICY "Users can view own earnings"
  ON public.user_earnings
  FOR SELECT
  USING (user_id IN (SELECT id FROM public.telegram_users WHERE telegram_id::text = auth.jwt() ->> 'sub'));

-- Users can insert their own earnings
CREATE POLICY "Users can create own earnings"
  ON public.user_earnings
  FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.telegram_users WHERE telegram_id::text = auth.jwt() ->> 'sub'));

-- Users can view their own wallet bindings
CREATE POLICY "Users can view own wallet bindings"
  ON public.wallet_bindings
  FOR SELECT
  USING (user_id IN (SELECT id FROM public.telegram_users WHERE telegram_id::text = auth.jwt() ->> 'sub'));

-- Users can manage their own wallet bindings
CREATE POLICY "Users can manage own wallet bindings"
  ON public.wallet_bindings
  FOR ALL
  USING (user_id IN (SELECT id FROM public.telegram_users WHERE telegram_id::text = auth.jwt() ->> 'sub'));

-- ==========================================
-- SEED 20 EARNING STRATEGIES
-- ==========================================
INSERT INTO public.earning_strategies (slug, name, category, description, reward_type, base_reward, reward_currency, is_active, requires_telegram, requires_wallet, cooldown_seconds, metadata)
VALUES
  ('watch-to-earn', 'Watch-to-Earn', 'ads', 'Earn by watching rewarded video ads in the cinema/stream module.', 'points', 0.05, 'USDT', true, true, false, 30, '{"module": "cinema"}'),
  ('telegram-stars', 'Telegram Stars Purchase', 'task', 'Purchase Telegram Stars to unlock premium tasks and VIP boosts.', 'stars', 10, 'XTR', true, true, false, 0, '{"provider": "telegram"}'),
  ('ton-deposit-bonus', 'TON Deposit Bonus', 'defi', 'Receive a bonus when depositing TON to your linked wallet.', 'ton', 1, 'TON', true, true, true, 3600, '{"network": "ton"}'),
  ('solana-staking', 'Solana Staking Rewards', 'defi', 'Stake SOL and earn yield paid into your earnings ledger.', 'sol', 0.01, 'SOL', true, true, true, 86400, '{"network": "solana"}'),
  ('adsgram-rewarded-video', 'Adsgram Rewarded Video', 'ads', 'Complete Adsgram rewarded video ads for instant micro-rewards.', 'usdt', 0.005, 'USDT', true, true, false, 60, '{"provider": "adsgram"}'),
  ('referral-commission', 'Referral Commission', 'referral', 'Earn 5-10% commission on referrals who complete tasks or deposits.', 'usdt', 1, 'USDT', true, true, false, 0, '{"rate": "5-10%"}'),
  ('daily-checkin', 'Daily Check-in Bonus', 'bonus', 'Claim a daily login bonus with streak multipliers.', 'points', 0.01, 'USDT', true, true, false, 86400, '{"streak": true}'),
  ('task-completion', 'Task Completion Reward', 'task', 'Complete platform tasks for personal or training accounts.', 'points', 0.25, 'USDT', true, true, false, 0, '{"accounts": ["personal", "training"]}'),
  ('training-account-bonus', 'Training Account Bonus', 'task', 'Extra bonus when completing all 45 training tasks.', 'points', 5, 'USDT', true, true, false, 0, '{"account_type": "training"}'),
  ('vip-level-bonus', 'VIP Level Bonus', 'bonus', 'Receive bonus yields based on VIP tier.', 'usdt', 2, 'USDT', true, true, false, 0, '{"vip_levels": [1,2,3,4,5]}'),
  ('executive-vault-yield', 'Executive Vault Yield', 'defi', 'Auto-yield from the executive vault across ad and task cycles.', 'usdt', 0.5, 'USDT', true, true, true, 1800, '{"vault": true}'),
  ('cinema-stream-reward', 'NELLY TV Stream Reward', 'streaming', 'Earn while watching NELLY TV streams and engagement events.', 'points', 0.02, 'USDT', true, true, false, 45, '{"module": "cinema"}'),
  ('ai-chat-engagement', 'AI Chat Engagement', 'ai', 'Earn rewards for productive AI chat sessions and prompt contributions.', 'points', 0.03, 'USDT', true, true, false, 120, '{"module": "ai"}'),
  ('social-share-bonus', 'Social Share Bonus', 'social', 'Earn for verified social shares of platform content.', 'points', 0.02, 'USDT', true, true, false, 3600, '{"platforms": ["telegram", "tiktok"]}'),
  ('matchmaking-reward', 'Matchmaking Reward', 'social', 'Earn rewards for completing matchmaking sessions.', 'points', 0.1, 'USDT', true, true, false, 300, '{"module": "matchmaking"}'),
  ('product-catalog-commission', 'Product Catalog Commission', 'task', 'Earn commission from product catalog purchases and conversions.', 'usdt', 0.5, 'USDT', true, true, false, 0, '{"module": "catalog"}'),
  ('ad-impression-revenue', 'Ad Impression Revenue Share', 'ads', 'Earn from ad impressions across app surfaces.', 'usdt', 0.0001, 'USDT', true, true, false, 1, '{"module": "ads"}'),
  ('multi-chain-yield', 'Multi-Chain Yield Farming', 'defi', 'Earn yield across TON, Solana, and BSC chains.', 'usdt', 0.2, 'USDT', true, true, true, 43200, '{"chains": ["ton", "solana", "bsc"]}'),
  ('mini-app-engagement', 'Mini App Engagement', 'mini-app', 'Earn for completing mini-app sessions inside Telegram.', 'points', 0.015, 'USDT', true, true, false, 90, '{"platform": "telegram"}'),
  ('executive-membership', 'Executive Membership Fee', 'bonus', 'Earn executive membership rewards and fee rebates.', 'usdt', 1, 'USDT', true, true, false, 0, '{"tier": "executive"}')
ON CONFLICT (slug) DO NOTHING;
