-- Migration: Create TikTok6 Core Feed Tables and Storage Buckets
-- Phase 1 - TikTok6 Core Feed Recovery
-- This migration creates the necessary database tables and storage buckets for the video feed

-- ===========================================
-- 1. CREATE STORAGE BUCKETS
-- ===========================================

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create thumbnails storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- 2. CREATE CREATOR_VIDEOS TABLE
-- ===========================================

-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS creator_videos CASCADE;

CREATE TABLE creator_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    is_premium BOOLEAN DEFAULT false,
    unlock_cost INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    creator_name TEXT,
    creator_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for creator_videos
CREATE INDEX IF NOT EXISTS idx_creator_videos_creator_id ON creator_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_videos_created_at ON creator_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_videos_is_premium ON creator_videos(is_premium);

-- ===========================================
-- 3. CREATE MATCHMAKING_PROFILES TABLE
-- ===========================================

-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS matchmaking_profiles CASCADE;

CREATE TABLE matchmaking_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    display_name TEXT NOT NULL,
    bio TEXT,
    profile_type TEXT DEFAULT 'standard',
    location TEXT,
    avatar_url TEXT,
    age INTEGER,
    gender TEXT,
    interests TEXT[],
    looking_for TEXT[],
    verification_status TEXT DEFAULT 'unverified',
    reputation_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for matchmaking_profiles
CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_profile_type ON matchmaking_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_location ON matchmaking_profiles(location);
CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_verification_status ON matchmaking_profiles(verification_status);

-- ===========================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE creator_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 5. RLS POLICIES FOR CREATOR_VIDEOS
-- ===========================================

-- Public read access for all videos (feed needs to be viewable)
CREATE POLICY "Public can view creator videos" ON creator_videos
    FOR SELECT USING (true);

-- Admin can insert/update/delete videos
CREATE POLICY "Admins can manage creator videos" ON creator_videos
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE account_type = 'admin'
        )
    );

-- ===========================================
-- 6. RLS POLICIES FOR MATCHMAKING_PROFILES
-- ===========================================

-- Public read access for all profiles
CREATE POLICY "Public can view matchmaking profiles" ON matchmaking_profiles
    FOR SELECT USING (true);

-- Admin can insert/update/delete profiles
CREATE POLICY "Admins can manage matchmaking profiles" ON matchmaking_profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE account_type = 'admin'
        )
    );

-- Users can view own profile
CREATE POLICY "Users can view own matchmaking profile" ON matchmaking_profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE email = display_name
        )
    );

-- ===========================================
-- 7. STORAGE BUCKET RLS POLICIES
-- ===========================================

-- Public read access for videos bucket
CREATE POLICY "Public can view videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');

-- Public read access for thumbnails bucket
CREATE POLICY "Public can view thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

-- Admin can upload to videos bucket
CREATE POLICY "Admins can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'videos' AND
        auth.uid() IN (
            SELECT id FROM users WHERE account_type = 'admin'
        )
    );

-- Admin can upload to thumbnails bucket
CREATE POLICY "Admins can upload thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails' AND
        auth.uid() IN (
            SELECT id FROM users WHERE account_type = 'admin'
        )
    );

-- ===========================================
-- 8. UPDATE TIMESTAMP TRIGGER
-- ===========================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to creator_videos
DROP TRIGGER IF EXISTS update_creator_videos_updated_at ON creator_videos;
CREATE TRIGGER update_creator_videos_updated_at BEFORE UPDATE ON creator_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to matchmaking_profiles
DROP TRIGGER IF EXISTS update_matchmaking_profiles_updated_at ON matchmaking_profiles;
CREATE TRIGGER update_matchmaking_profiles_updated_at BEFORE UPDATE ON matchmaking_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 9. VERIFICATION
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '✅ TikTok6 Core Feed Tables Created Successfully';
    RAISE NOTICE '✅ Storage Buckets: videos, thumbnails';
    RAISE NOTICE '✅ Tables: creator_videos, matchmaking_profiles';
    RAISE NOTICE '✅ RLS Policies Enabled';
    RAISE NOTICE '✅ Timestamp Triggers Applied';
END $$;
