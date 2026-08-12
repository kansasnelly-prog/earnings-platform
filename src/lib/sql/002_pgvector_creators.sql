-- Module: pgvector creators
-- Description: Adds vector embedding support for TikTok6 creator matching and recommendation engine

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.tiktok6_creators (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  follower_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5, 4) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiktok6_creators_user_id ON public.tiktok6_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok6_creators_category ON public.tiktok6_creators(category);
CREATE INDEX IF NOT EXISTS idx_tiktok6_creators_is_active ON public.tiktok6_creators(is_active);
CREATE INDEX IF NOT EXISTS idx_tiktok6_creators_embedding ON public.tiktok6_creators USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_tiktok6_creators(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 20,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  display_name TEXT,
  handle TEXT,
  category TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  follower_count INTEGER,
  engagement_rate NUMERIC,
  is_verified BOOLEAN,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.display_name,
    c.handle,
    c.category,
    c.bio,
    c.avatar_url,
    c.location,
    c.follower_count,
    c.engagement_rate,
    c.is_verified,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.tiktok6_creators c
  WHERE
    c.is_active = TRUE
    AND c.embedding IS NOT NULL
    AND (category_filter IS NULL OR c.category = category_filter)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE public.tiktok6_creators IS 'TikTok6 creator profiles with vector embeddings for semantic matching';
