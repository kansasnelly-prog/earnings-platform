-- Add download tracking fields to profiles table
-- Module 1: Download Engine & Device Fingerprint Schema

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS install_device_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS install_fingerprint UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS download_bonus_awarded BOOLEAN DEFAULT FALSE;

-- Create index for device type analytics
CREATE INDEX IF NOT EXISTS idx_profiles_install_device_type ON profiles(install_device_type);
CREATE INDEX IF NOT EXISTS idx_profiles_download_bonus_awarded ON profiles(download_bonus_awarded);

-- Add comments for documentation
COMMENT ON COLUMN profiles.install_device_type IS 'Device type of app installation: android, ios, web, desktop';
COMMENT ON COLUMN profiles.install_fingerprint IS 'Unique device fingerprint for tracking installations';
COMMENT ON COLUMN profiles.download_bonus_awarded IS 'Flag indicating if +10 NellyCoin download bonus has been awarded';
