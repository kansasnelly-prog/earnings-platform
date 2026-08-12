import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('CRITICAL ERROR: Supabase credentials missing for TikTok6 Matchmaker.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface CreatorProfile {
  id: number;
  user_id: string;
  display_name: string;
  handle?: string;
  category: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  follower_count: number;
  engagement_rate: number;
  is_verified: boolean;
  similarity?: number;
}

export interface MatchmakerOptions {
  queryEmbedding: number[];
  matchThreshold?: number;
  matchCount?: number;
  categoryFilter?: string;
}

export async function findSimilarCreators(options: MatchmakerOptions): Promise<CreatorProfile[]> {
  const { queryEmbedding, matchThreshold = 0.7, matchCount = 20, categoryFilter } = options;

  try {
    const { data, error } = await supabase.rpc('match_tiktok6_creators', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      category_filter: categoryFilter || null,
    });

    if (error) {
      console.error('[Matchmaker] Error finding similar creators:', error);
      return [];
    }

    return (data || []) as CreatorProfile[];
  } catch (error) {
    console.error('[Matchmaker] Exception finding similar creators:', error);
    return [];
  }
}

export async function getCreatorByHandle(handle: string): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from('tiktok6_creators')
      .select('*')
      .eq('handle', handle)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as CreatorProfile;
  } catch (error) {
    console.error('[Matchmaker] Error fetching creator by handle:', error);
    return null;
  }
}

export async function updateCreatorEmbedding(
  creatorId: number,
  embedding: number[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tiktok6_creators')
      .update({
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creatorId);

    if (error) {
      console.error('[Matchmaker] Error updating creator embedding:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Matchmaker] Exception updating creator embedding:', error);
    return false;
  }
}

export async function createCreatorProfile(profile: {
  user_id: string;
  display_name: string;
  handle: string;
  category: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  follower_count?: number;
  engagement_rate?: number;
  is_verified?: boolean;
  embedding?: number[];
}): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from('tiktok6_creators')
      .insert({
        user_id: profile.user_id,
        display_name: profile.display_name,
        handle: profile.handle,
        category: profile.category,
        bio: profile.bio || null,
        avatar_url: profile.avatar_url || null,
        location: profile.location || null,
        follower_count: profile.follower_count || 0,
        engagement_rate: profile.engagement_rate || 0,
        is_verified: profile.is_verified || false,
        embedding: profile.embedding || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Matchmaker] Error creating creator profile:', error);
      return null;
    }

    return data as CreatorProfile;
  } catch (error) {
    console.error('[Matchmaker] Exception creating creator profile:', error);
    return null;
  }
}
