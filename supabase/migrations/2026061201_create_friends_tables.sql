-- Migration: Create TikTok Friends Page Tables
-- Creates tables for friend requests, live streams, and friend activities

-- ============================================
-- TABLE: friend_requests
-- ============================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON friend_requests(created_at DESC);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own friend requests"
  ON friend_requests
  FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests"
  ON friend_requests
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received friend requests"
  ON friend_requests
  FOR UPDATE
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete own friend requests"
  ON friend_requests
  FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================
-- TABLE: live_streams
-- ============================================
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  viewer_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_started_at ON live_streams(started_at DESC);

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view live streams"
  ON live_streams
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own live streams"
  ON live_streams
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own live streams"
  ON live_streams
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own live streams"
  ON live_streams
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TABLE: friend_activities
-- ============================================
CREATE TABLE IF NOT EXISTS friend_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('follow', 'like', 'comment', 'share', 'live_start', 'post', 'story')),
  target_type TEXT,
  target_id UUID,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_activities_user_id ON friend_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_activities_activity_type ON friend_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_friend_activities_target_user_id ON friend_activities(target_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_activities_created_at ON friend_activities(created_at DESC);

-- Enable RLS
ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view friend activities"
  ON friend_activities
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    target_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM followers f
      WHERE (f.follower_id = auth.uid() AND f.following_id = friend_activities.user_id) OR
            (f.follower_id = friend_activities.user_id AND f.following_id = auth.uid())
    )
  );

CREATE POLICY "Users can create own activities"
  ON friend_activities
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update friend_requests timestamp
CREATE OR REPLACE FUNCTION update_friend_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_friend_requests_timestamp ON friend_requests;
CREATE TRIGGER trigger_update_friend_requests_timestamp
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_requests_timestamp();

-- Function to create friend activity
CREATE OR REPLACE FUNCTION create_friend_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO friend_activities (user_id, activity_type, target_type, target_id, target_user_id, metadata)
  VALUES (p_user_id, p_activity_type, p_target_type, p_target_id, p_target_user_id, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(p_user1_id UUID, p_user2_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT CASE
    WHEN f1.follower_id = p_user1_id THEN f1.following_id
    WHEN f1.following_id = p_user1_id THEN f1.follower_id
  END)
  INTO v_count
  FROM followers f1
  JOIN followers f2 ON (
    (f1.follower_id = p_user1_id AND f2.follower_id = p_user2_id AND f1.following_id = f2.following_id) OR
    (f1.following_id = p_user1_id AND f2.following_id = p_user2_id AND f1.follower_id = f2.follower_id)
  );
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friend suggestions
CREATE OR REPLACE FUNCTION get_friend_suggestions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  mutual_friends_count INTEGER,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    get_mutual_friends_count(p_user_id, up.user_id) as mutual_friends_count,
    CASE 
      WHEN get_mutual_friends_count(p_user_id, up.user_id) > 0 THEN 'mutual_friends'
      ELSE 'suggested'
    END as reason
  FROM user_profiles up
  WHERE up.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM followers f
      WHERE (f.follower_id = p_user_id AND f.following_id = up.user_id) OR
            (f.follower_id = up.user_id AND f.following_id = p_user_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM friend_requests fr
      WHERE (fr.sender_id = p_user_id AND fr.receiver_id = up.user_id) OR
            (fr.sender_id = up.user_id AND fr.receiver_id = p_user_id)
    )
  ORDER BY mutual_friends_count DESC, up.followers_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follow-back recommendations
CREATE OR REPLACE FUNCTION get_follow_back_recommendations(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  followed_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    f.created_at as followed_since
  FROM followers f
  JOIN user_profiles up ON f.following_id = up.user_id
  WHERE f.follower_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM followers f2
      WHERE f2.follower_id = f.following_id AND f2.following_id = p_user_id
    )
  ORDER BY f.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ TikTok Friends Tables Created Successfully';
  RAISE NOTICE '✅ Tables: friend_requests, live_streams, friend_activities';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Functions created: get_mutual_friends_count, get_friend_suggestions, get_follow_back_recommendations';
  RAISE NOTICE '✅ Triggers created';
END $$;
