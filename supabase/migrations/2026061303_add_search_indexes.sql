-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for Search
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON user_profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON user_profiles USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_videos_caption_trgm ON creator_videos USING gin (caption gin_trgm_ops);
