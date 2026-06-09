-- Migration: Create TikTok Profile & Social Tables
-- Creates tables for video comments, bookmarks, followers, video views, and user profiles

-- ============================================
-- TABLE: video_comments
-- ============================================
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_created_at ON video_comments(created_at DESC);

-- Enable RLS
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view video comments"
  ON video_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own comments"
  ON video_comments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON video_comments
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON video_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TABLE: video_bookmarks
-- ============================================
CREATE TABLE IF NOT EXISTS video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_video_id ON video_bookmarks(video_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user_id ON video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_created_at ON video_bookmarks(created_at DESC);

-- Enable RLS
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bookmarks"
  ON video_bookmarks
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookmarks"
  ON video_bookmarks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks"
  ON video_bookmarks
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TABLE: followers
-- ============================================
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON followers(created_at DESC);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view followers"
  ON followers
  FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create follow relationships"
  ON followers
  FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete own follow relationships"
  ON followers
  FOR DELETE
  USING (follower_id = auth.uid());

-- ============================================
-- TABLE: video_views
-- ============================================
CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration INTEGER DEFAULT 0 -- in seconds
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON video_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view video views"
  ON video_views
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own video views"
  ON video_views
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- TABLE: user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_followers_count ON user_profiles(followers_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view user profiles"
  ON user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update followers count when someone follows
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE user_profiles
    SET following_count = following_count + 1
    WHERE user_id = NEW.follower_id;
    
    -- Increment followers count for following
    UPDATE user_profiles
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE user_profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE user_id = OLD.follower_id;
    
    -- Decrement followers count for following
    UPDATE user_profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update followers count
DROP TRIGGER IF EXISTS trigger_update_followers_count ON followers;
CREATE TRIGGER trigger_update_followers_count
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_followers_count();

-- Function to update video comments count
CREATE OR REPLACE FUNCTION update_video_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creator_videos
    SET comments_count = comments_count + 1
    WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creator_videos
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update comments count
DROP TRIGGER IF EXISTS trigger_update_video_comments_count ON video_comments;
CREATE TRIGGER trigger_update_video_comments_count
  AFTER INSERT OR DELETE ON video_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_video_comments_count();

-- Function to update videos count in user_profiles
CREATE OR REPLACE FUNCTION update_videos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get creator_id from creator_videos and update videos_count
    UPDATE user_profiles
    SET videos_count = videos_count + 1
    WHERE user_id = (SELECT creator_id::uuid FROM creator_videos WHERE id = NEW.video_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles
    SET videos_count = GREATEST(videos_count - 1, 0)
    WHERE user_id = (SELECT creator_id::uuid FROM creator_videos WHERE id = OLD.video_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update videos count (when videos are added/removed)
-- Note: This would need to be triggered on creator_videos table, not video_views

-- Function to update likes count in user_profiles (aggregate from creator_videos)
CREATE OR REPLACE FUNCTION update_user_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Update user's total likes count when video likes change
    UPDATE user_profiles
    SET likes_count = (
      SELECT COALESCE(SUM(likes_count), 0)
      FROM creator_videos
      WHERE creator_id = user_id::text
    )
    WHERE user_id = (
      SELECT creator_id::uuid
      FROM creator_videos
      WHERE id = NEW.id
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update likes count
DROP TRIGGER IF EXISTS trigger_update_user_likes_count ON creator_videos;
CREATE TRIGGER trigger_update_user_likes_count
  AFTER UPDATE ON creator_videos
  FOR EACH ROW
  WHEN (OLD.likes_count IS DISTINCT FROM NEW.likes_count)
  EXECUTE FUNCTION update_user_likes_count();

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ TikTok Profile & Social Tables Created Successfully';
  RAISE NOTICE '✅ Tables: video_comments, video_bookmarks, followers, video_views, user_profiles';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Functions and triggers created';
END $$;
