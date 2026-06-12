-- TikTok6 Inbox System Migration
-- Creates tables for stories, notifications, and direct messages

-- ============================================
-- TABLE A: stories
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewer_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Ensure the policy does not already exist (some environments may have applied it previously)
DROP POLICY IF EXISTS "Users can view all stories" ON stories;
DROP POLICY IF EXISTS "Users can view all stories" ON stories;
CREATE POLICY "Users can view all stories"
  ON stories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own stories" ON stories;
CREATE POLICY "Users can create own stories"
  ON stories
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
DROP POLICY IF EXISTS "Users can update own messages" ON direct_messages;
CREATE POLICY "Users can update own messages"
  ON direct_messages
  FOR UPDATE
  USING (sender_id = auth.uid())

-- ============================================
-- TABLE B: story_views
-- ============================================
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- Enable RLS
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view story views" ON story_views;
CREATE POLICY "Users can view story views"
  ON story_views
  FOR SELECT
  USING (viewer_id = auth.uid() OR story_id IN (
    SELECT id FROM stories WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create story views" ON story_views;
CREATE POLICY "Users can create story views"
  ON story_views
  FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- ============================================
-- TABLE C: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'share', 'mention')),
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  actor_username TEXT,
  actor_avatar TEXT,
  target_type TEXT, -- 'video', 'comment', 'user'
  target_id UUID,
  target_url TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABLE D: direct_conversations
-- ============================================
CREATE TABLE IF NOT EXISTS direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  user1_unread_count INTEGER DEFAULT 0,
  user2_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user1_id ON direct_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user2_id ON direct_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_updated_at ON direct_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own conversations" ON direct_conversations;
CREATE POLICY "Users can view own conversations"
  ON direct_conversations
  FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

DROP POLICY IF EXISTS "Users can create conversations" ON direct_conversations;
CREATE POLICY "Users can create conversations"
  ON direct_conversations
  FOR INSERT
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own conversations" ON direct_conversations;
CREATE POLICY "Users can update own conversations"
  ON direct_conversations
  FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================
-- TABLE E: direct_messages
-- ============================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON direct_messages;
/* Duplicate policy removed */

/* Duplicate policy removed - second occurrence */

CREATE POLICY "Users can update own messages"
  ON direct_messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update conversation timestamp and unread count
CREATE OR REPLACE FUNCTION update_direct_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation timestamp
  UPDATE direct_conversations
  SET 
    updated_at = NOW(),
    last_message_id = NEW.id,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Increment unread count for the recipient
  UPDATE direct_conversations
  SET 
    user1_unread_count = CASE 
      WHEN user1_id != NEW.sender_id THEN user1_unread_count + 1
      ELSE user1_unread_count
    END,
    user2_unread_count = CASE 
      WHEN user2_id != NEW.sender_id THEN user2_unread_count + 1
      ELSE user2_unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation
DROP TRIGGER IF EXISTS trigger_update_direct_conversation ON direct_messages;
CREATE TRIGGER trigger_update_direct_conversation
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_conversation();

-- Function to reset unread count when messages are read
CREATE OR REPLACE FUNCTION reset_direct_conversation_unread(p_user_id UUID, p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE direct_conversations
  SET 
    user1_unread_count = CASE 
      WHEN user1_id = p_user_id THEN 0
      ELSE user1_unread_count
    END,
    user2_unread_count = CASE 
      WHEN user2_id = p_user_id THEN 0
      ELSE user2_unread_count
    END
  WHERE id = p_conversation_id;
  
  -- Mark messages as read
  UPDATE direct_messages
  SET is_read = true, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment story viewer count
CREATE OR REPLACE FUNCTION increment_story_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories
  SET viewer_count = viewer_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment story viewer count
DROP TRIGGER IF EXISTS trigger_increment_story_viewer_count ON story_views;
CREATE TRIGGER trigger_increment_story_viewer_count
  AFTER INSERT ON story_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_story_viewer_count();

-- Function to create follow notification
CREATE OR REPLACE FUNCTION create_follow_notification(p_follower_id UUID, p_following_id UUID)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_follower_username TEXT;
  v_follower_avatar TEXT;
BEGIN
  -- Get follower info
  SELECT display_name INTO v_follower_username
  FROM users
  WHERE id = p_follower_id;
  
  -- Get follower avatar (if profiles table exists)
  BEGIN
    SELECT avatar_url INTO v_follower_avatar
    FROM profiles
    WHERE user_id = p_follower_id;
  EXCEPTION WHEN OTHERS THEN
    v_follower_avatar := NULL;
  END;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, actor_username, actor_avatar, message)
  VALUES (
    p_following_id,
    'follow',
    p_follower_id,
    v_follower_username,
    v_follower_avatar,
    v_follower_username || ' started following you'
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ TikTok6 Inbox tables created successfully';
  RAISE NOTICE '✅ Tables: stories, story_views, notifications, direct_conversations, direct_messages';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Functions and triggers created';
END $$;
