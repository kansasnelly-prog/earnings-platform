-- Migration: TikTok Profile Enhancements
-- Adds missing tables for full TikTok profile parity
-- Includes: profile views, pinned videos, collections, story highlights, creator badges, subscriptions, and more

-- ============================================
-- TABLE: profile_views
-- ============================================
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user_id ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can insert profile views" ON profile_views;
CREATE POLICY "Public can insert profile views"
  ON profile_views
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;
CREATE POLICY "Users can view own profile views"
  ON profile_views
  FOR SELECT
  USING (profile_user_id = auth.uid());

-- ============================================
-- TABLE: pinned_videos
-- ============================================
CREATE TABLE IF NOT EXISTS pinned_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER DEFAULT 0,
  UNIQUE(user_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pinned_videos_user_id ON pinned_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_videos_position ON pinned_videos(user_id, position);

-- Enable RLS
ALTER TABLE pinned_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view pinned videos" ON pinned_videos;
CREATE POLICY "Public can view pinned videos"
  ON pinned_videos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own pinned videos" ON pinned_videos;
CREATE POLICY "Users can manage own pinned videos"
  ON pinned_videos
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TABLE: video_collections
-- ============================================
CREATE TABLE IF NOT EXISTS video_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_video_id UUID REFERENCES creator_videos(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_collections_user_id ON video_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_video_collections_is_public ON video_collections(is_public);

-- Enable RLS
ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view public collections" ON video_collections;
CREATE POLICY "Public can view public collections"
  ON video_collections
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can manage own collections" ON video_collections;
CREATE POLICY "Users can manage own collections"
  ON video_collections
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TABLE: collection_videos
-- ============================================
CREATE TABLE IF NOT EXISTS collection_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER DEFAULT 0,
  UNIQUE(collection_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_videos_collection_id ON collection_videos(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_videos_video_id ON collection_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_collection_videos_position ON collection_videos(collection_id, position);

-- Enable RLS
ALTER TABLE collection_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view collection videos" ON collection_videos;
CREATE POLICY "Users can view collection videos"
  ON collection_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_collections 
      WHERE id = collection_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own collection videos" ON collection_videos;
CREATE POLICY "Users can manage own collection videos"
  ON collection_videos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_collections 
      WHERE id = collection_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- TABLE: video_sounds
-- ============================================
CREATE TABLE IF NOT EXISTS video_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_video_id UUID REFERENCES creator_videos(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_sounds_creator_id ON video_sounds(creator_id);
CREATE INDEX IF NOT EXISTS idx_video_sounds_usage_count ON video_sounds(usage_count DESC);

-- Enable RLS
ALTER TABLE video_sounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view sounds" ON video_sounds;
CREATE POLICY "Public can view sounds"
  ON video_sounds
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create sounds" ON video_sounds;
CREATE POLICY "Users can create sounds"
  ON video_sounds
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- ============================================
-- TABLE: video_effects
-- ============================================
CREATE TABLE IF NOT EXISTS video_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  preview_url TEXT,
  category TEXT,
  is_trending BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_effects_category ON video_effects(category);
CREATE INDEX IF NOT EXISTS idx_video_effects_is_trending ON video_effects(is_trending);
CREATE INDEX IF NOT EXISTS idx_video_effects_usage_count ON video_effects(usage_count DESC);

-- Enable RLS
ALTER TABLE video_effects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view effects" ON video_effects;
CREATE POLICY "Public can view effects"
  ON video_effects
  FOR SELECT
  USING (true);

-- ============================================
-- TABLE: video_reposts
-- ============================================
CREATE TABLE IF NOT EXISTS video_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_video_id UUID NOT NULL REFERENCES creator_videos(id) ON DELETE CASCADE,
  reposter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT,
  reposted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_video_id, reposter_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_reposts_original_video_id ON video_reposts(original_video_id);
CREATE INDEX IF NOT EXISTS idx_video_reposts_reposter_id ON video_reposts(reposter_id);
CREATE INDEX IF NOT EXISTS idx_video_reposts_reposted_at ON video_reposts(reposted_at DESC);

-- Enable RLS
ALTER TABLE video_reposts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view reposts" ON video_reposts;
CREATE POLICY "Public can view reposts"
  ON video_reposts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own reposts" ON video_reposts;
CREATE POLICY "Users can create own reposts"
  ON video_reposts
  FOR INSERT
  WITH CHECK (reposter_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reposts" ON video_reposts;
CREATE POLICY "Users can delete own reposts"
  ON video_reposts
  FOR DELETE
  USING (reposter_id = auth.uid());

-- ============================================
-- TABLE: story_highlights
-- ============================================
CREATE TABLE IF NOT EXISTS story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_story_highlights_user_id ON story_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_position ON story_highlights(user_id, position);

-- Enable RLS
ALTER TABLE story_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view story highlights" ON story_highlights;
CREATE POLICY "Public can view story highlights"
  ON story_highlights
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own story highlights" ON story_highlights;
CREATE POLICY "Users can manage own story highlights"
  ON story_highlights
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TABLE: highlight_stories
-- ============================================
CREATE TABLE IF NOT EXISTS highlight_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  UNIQUE(highlight_id, story_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_highlight_stories_highlight_id ON highlight_stories(highlight_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_story_id ON highlight_stories(story_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_position ON highlight_stories(highlight_id, position);

-- Enable RLS
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view highlight stories" ON highlight_stories;
CREATE POLICY "Public can view highlight stories"
  ON highlight_stories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own highlight stories" ON highlight_stories;
CREATE POLICY "Users can manage own highlight stories"
  ON highlight_stories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM story_highlights 
      WHERE id = highlight_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- ALTER TABLE: user_profiles (add missing fields)
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS creator_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_duet BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_stitch BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;

-- ============================================
-- ALTER TABLE: creator_videos (add missing fields)
-- ============================================
ALTER TABLE creator_videos
ADD COLUMN IF NOT EXISTS duration INTEGER, -- in seconds
ADD COLUMN IF NOT EXISTS sound_id UUID REFERENCES video_sounds(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_duet_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_stitch_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS effect_id UUID REFERENCES video_effects(id) ON DELETE SET NULL;

-- ============================================
-- TABLE: creator_subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'standard', -- standard, premium, vip
  monthly_price DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(creator_id, subscriber_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_creator_id ON creator_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_subscriber_id ON creator_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_is_active ON creator_subscriptions(is_active);

-- Enable RLS
ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON creator_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON creator_subscriptions
  FOR SELECT
  USING (subscriber_id = auth.uid() OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create subscriptions" ON creator_subscriptions;
CREATE POLICY "Users can create subscriptions"
  ON creator_subscriptions
  FOR INSERT
  WITH CHECK (subscriber_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON creator_subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON creator_subscriptions
  FOR UPDATE
  USING (subscriber_id = auth.uid());

-- ============================================
-- TABLE: tiktok_studio
-- ============================================
CREATE TABLE IF NOT EXISTS tiktok_studio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_followers_gained INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  profile_completion_score INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tiktok_studio_user_id ON tiktok_studio(user_id);

-- Enable RLS
ALTER TABLE tiktok_studio ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own studio" ON tiktok_studio;
CREATE POLICY "Users can view own studio"
  ON tiktok_studio
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own studio" ON tiktok_studio;
CREATE POLICY "Users can update own studio"
  ON tiktok_studio
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to increment profile views count
CREATE OR REPLACE FUNCTION increment_profile_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET profile_views_count = profile_views_count + 1
  WHERE user_id = NEW.profile_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment profile views count
DROP TRIGGER IF EXISTS trigger_increment_profile_views_count ON profile_views;
CREATE TRIGGER trigger_increment_profile_views_count
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_profile_views_count();

-- Function to update collection updated_at
CREATE OR REPLACE FUNCTION update_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_collections
  SET updated_at = NOW()
  WHERE id = NEW.collection_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update collection timestamp
DROP TRIGGER IF EXISTS trigger_update_collection_updated_at ON collection_videos;
CREATE TRIGGER trigger_update_collection_updated_at
  AFTER INSERT OR DELETE ON collection_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ TikTok Profile Enhancements Migration Complete';
  RAISE NOTICE '✅ New Tables: profile_views, pinned_videos, video_collections, collection_videos, video_sounds, video_effects, video_reposts, story_highlights, highlight_stories, creator_subscriptions, tiktok_studio';
  RAISE NOTICE '✅ Enhanced user_profiles with: website_url, social links, creator_badges, privacy settings, profile_views_count';
  RAISE NOTICE '✅ Enhanced creator_videos with: duration, sound_id, privacy settings, effect_id';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Functions and triggers created';
END $$;
