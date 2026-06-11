import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Video {
  id: string;
  creator_id: string;
  video_url: string;
  thumbnail_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  creator_name: string;
  creator_avatar: string;
  created_at: string;
}

export function useTikTokFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('creator_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;
      
      setVideos(prev => cursor ? [...prev, ...(data || [])] : (data || []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, fetchVideos };
}
