-- Add wallet_address column to users table
-- This migration adds a nullable wallet_address column to the users table
-- to support wallet binding/unbinding functionality

ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
