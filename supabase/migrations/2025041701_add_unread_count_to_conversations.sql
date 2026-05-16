-- Add unread_count column to conversations table
-- This migration adds an unread_count column to track unread messages from customers

-- Add unread_count column with default 0
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Create index for faster unread count lookups
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count ON conversations(unread_count);

-- ============================================
-- FUNCTION: Increment unread count when customer sends message
-- ============================================
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if sender is user (customer)
  IF NEW.sender = 'user' THEN
    UPDATE conversations
    SET unread_count = unread_count + 1
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Reset unread count when admin opens conversation
-- ============================================
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET unread_count = 0
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_increment_unread_count ON messages;
DROP TRIGGER IF EXISTS trigger_reset_unread_count ON messages;

-- Create trigger to increment unread count on customer messages
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Note: The reset_unread_count trigger should be called when admin reads messages
-- This will be handled via API call when admin opens a conversation
