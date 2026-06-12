-- Migration: Create TikTok6 earnings ledger tables
-- Date: 2026-06-20

-- 1. Creator earnings ledger
CREATE TABLE IF NOT EXISTS public.tiktok6_creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- gifts, coins, premium, subscription, live_gift, referral
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB
);

-- 2. Withdrawal requests
CREATE TABLE IF NOT EXISTS public.tiktok6_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    method_id UUID REFERENCES public.tiktok6_payout_methods(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Paid, Rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Payout methods
CREATE TABLE IF NOT EXISTS public.tiktok6_payout_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Withdrawal audit log
CREATE TABLE IF NOT EXISTS public.tiktok6_withdrawal_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    withdrawal_id UUID REFERENCES public.tiktok6_withdrawals(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- created, approved, paid, rejected
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tiktok6_creator_earnings_creator ON public.tiktok6_creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_tiktok6_withdrawals_creator ON public.tiktok6_withdrawals(creator_id);
CREATE INDEX IF NOT EXISTS idx_tiktok6_withdrawal_audit_withdrawal ON public.tiktok6_withdrawal_audit(withdrawal_id);
