-- Module 1: Database Schema Correction - Add total_tasks column to users table
-- This migration fixes the schema cache mismatch error during registration

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_tasks integer DEFAULT 45;

-- Add comment for documentation
COMMENT ON COLUMN users.total_tasks IS 'Total number of tasks for the user account (45 for training, 35 for personal)';

-- Notify the PostgREST cache layer to forcefully rebuild its schema definitions
NOTIFY pgrst, 'reload schema';
