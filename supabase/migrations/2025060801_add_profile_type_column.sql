-- Migration: Add profile_type column to matchmaking_profiles table
-- This migration adds the missing profile_type column to resolve infinite loading loops
-- Protocol 15 - Schema Purification Override

ALTER TABLE public.matchmaking_profiles 
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'standard';

-- Add comment for documentation
COMMENT ON COLUMN public.matchmaking_profiles.profile_type IS 'Profile type: standard, single, traveler, or premium';
