-- Fix training_accounts table to match API requirements
-- This migration adds missing columns and renames user_id to auth_user_id

-- Add display_name column
ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Rename user_id to auth_user_id to match API
-- ALTER TABLE training_accounts
-- RENAME COLUMN user_id TO auth_user_id;

-- Add comments
COMMENT ON COLUMN training_accounts.display_name IS 'Display name for the training account';
-- COMMENT ON COLUMN training_accounts.auth_user_id IS 'Reference to Supabase Auth user ID';

-- Note: The following columns were already added in migration 2025050906:
-- - amount
-- - commission
-- - task_number
-- - product_name
-- - referral_code
-- - referred_by
-- - training_phase
