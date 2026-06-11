import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name: string;
}

export function useEngagement(videoId: string, userId: string, creatorId: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const checkEngagement = async () => {
      if (!userId) return;
      
      const { data: likeData } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', userId)
        .single();
      setIsLiked(!!likeData);

      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', creatorId)
        .single();
      setIsFollowing(!!followData);

      const { data: commentData } = await supabase
        .from('video_comments')
        .select('*, users:user_id(display_name)')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });
      
      if (commentData) {
        setComments(commentData.map(c => ({
          ...c,
          user_name: c.users.display_name
        })));
      }
    };
    checkEngagement();
  }, [videoId, userId, creatorId]);

  const toggleLike = async () => {
    if (isLiked) {
      await supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', userId);
      setLikesCount(prev => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      await supabase.from('video_likes').insert({ video_id: videoId, user_id: userId });
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
      await supabase.from('notifications').insert({ user_id: creatorId, type: 'like', actor_id: userId, target_id: videoId });
    }
  };

  const toggleFollow = async () => {
    if (isFollowing) {
      await supabase.from('followers').delete().eq('follower_id', userId).eq('following_id', creatorId);
      setIsFollowing(false);
    } else {
      await supabase.from('followers').insert({ follower_id: userId, following_id: creatorId });
      setIsFollowing(true);
      await supabase.from('notifications').insert({ user_id: creatorId, type: 'follow', actor_id: userId });
    }
  };

  const addComment = async (text: string) => {
    await supabase.from('video_comments').insert({ video_id: videoId, user_id: userId, comment: text });
    await supabase.from('notifications').insert({ user_id: creatorId, type: 'comment', actor_id: userId, target_id: videoId });
    // Refresh comments... simplified for now
  };

  const shareVideo = async () => {
    // Basic share tracking
    await supabase.from('notifications').insert({ user_id: creatorId, type: 'share', actor_id: userId, target_id: videoId });
  };

  return { isLiked, likesCount, toggleLike, isFollowing, toggleFollow, comments, addComment, shareVideo };
}
