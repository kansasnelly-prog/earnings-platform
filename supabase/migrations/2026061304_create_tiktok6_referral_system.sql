-- Create TikTok6 referral system
CREATE TABLE IF NOT EXISTS tiktok6_referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS tiktok6_referral_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_code VARCHAR(20) REFERENCES tiktok6_referrals(referral_code),
    event_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS tiktok6_referral_revenue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_owner_code VARCHAR(20) REFERENCES tiktok6_referrals(referral_code),
    referred_user_id UUID REFERENCES users(id),
    revenue_amount NUMERIC(10, 2) NOT NULL,
    source VARCHAR(50) NOT NULL, -- gifts, subscriptions, boosts, premium
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tiktok6_referrals_code ON tiktok6_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_tiktok6_referrals_referred_by ON tiktok6_referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_tiktok6_referral_revenue_owner ON tiktok6_referral_revenue(referral_owner_code);
