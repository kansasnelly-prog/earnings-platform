-- Migration: Extend profiles schema for monetization tracking
-- Date: 2026-06-04
-- Description: Add account tier, download tracking, and referral fields to profiles

-- Add account_tier column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_tier VARCHAR DEFAULT 'free';

-- Add total_downloads_tracked column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_downloads_tracked INTEGER DEFAULT 0;

-- Add referred_by column for referral tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Create index on referred_by for performance
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Create index on account_tier for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_account_tier ON profiles(account_tier);

-- Add comment for documentation
COMMENT ON COLUMN profiles.account_tier IS 'User account tier: free, premium, vip, etc.';
COMMENT ON COLUMN profiles.total_downloads_tracked IS 'Total number of app downloads tracked for this user';
COMMENT ON COLUMN profiles.referred_by IS 'UUID of the user who referred this user (if applicable)';
