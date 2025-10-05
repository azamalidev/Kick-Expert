-- Add public_profile column to profiles table
-- Migration: 20251004_add_public_profile_to_profiles

-- Add the column with default value of true (public)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT true;

-- Update all existing profiles to be public
UPDATE profiles
SET public_profile = true
WHERE public_profile IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.public_profile IS 'Whether the user profile is visible on leaderboards (true = public, false = private)';