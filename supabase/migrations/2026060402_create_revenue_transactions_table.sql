-- Migration: Create revenue_transactions table for monetization tracking
-- Date: 2026-06-04
-- Description: Track all revenue sources across 7 monetization engines

-- Create revenue_transactions table
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  revenue_source VARCHAR NOT NULL CHECK (revenue_source IN (
    'withdrawal_fee',
    'task_tax',
    'ad_network',
    'vip_sub',
    'marketplace',
    'app_store',
    'referral'
  )),
  amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
  nelly_coins_minted BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metadata for tracking
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_user_id ON revenue_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_revenue_source ON revenue_transactions(revenue_source);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created_at ON revenue_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_user_source ON revenue_transactions(user_id, revenue_source);

-- Create composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_source_created ON revenue_transactions(revenue_source, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE revenue_transactions IS 'Tracks all revenue transactions across 7 monetization engines';
COMMENT ON COLUMN revenue_transactions.revenue_source IS 'Source of revenue: withdrawal_fee, task_tax, ad_network, vip_sub, marketplace, app_store, referral';
COMMENT ON COLUMN revenue_transactions.amount_usd IS 'Revenue amount in USD';
COMMENT ON COLUMN revenue_transactions.nelly_coins_minted IS 'NellyCoins minted as a result of this transaction';
COMMENT ON COLUMN revenue_transactions.metadata IS 'Additional transaction metadata (e.g., transaction IDs, campaign data)';

-- Enable Row Level Security
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can read all, users can read their own
CREATE POLICY "Admins can view all revenue transactions"
  ON revenue_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Users can view their own revenue transactions"
  ON revenue_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No insert policy - only backend functions should insert revenue transactions
