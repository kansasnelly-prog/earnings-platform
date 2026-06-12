import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Gift, Volume2, VolumeX, Lock, Home, UserPlus, Plus, MessageSquare, User, Bookmark, Share2, Compass } from 'lucide-react';
import { useTikTokAutoplay } from '@/hooks/useTikTokAutoplay';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import CommentModal from './CommentModal';

interface CreatorVideo {
  id: string;
  creator_id: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  is_premium: boolean;
  unlock_cost: number;
  likes_count: number;
  comments_count: number;
  creator_name?: string;
  creator_avatar?: string;
}

const ShortVideoFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<string>>(new Set());
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  const videoRefsContainer = useRef<React.RefObject<HTMLVideoElement>[]>([]);
  
  useEffect(() => {
    loadVideos();
    loadUserBalance();
    loadBookmarks();
  }, []);

  // Instant Autoplay for the first video
  useEffect(() => {
    if (videos.length > 0 && videoRefsContainer.current[0]?.current) {
      const firstVideo = videoRefsContainer.current[0].current;
      firstVideo.muted = true;
      firstVideo.play().catch((err) => console.error('First video autoplay error:', err));
    }
  }, [videos]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setVideos(data || []);
      // Pre-allocate refs
      videoRefsContainer.current = Array.from({ length: data?.length || 0 }, () => React.createRef<HTMLVideoElement>());
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setNellyCoins(data?.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('video_bookmarks')
        .select('video_id')
        .eq('user_id', user.id);
      if (error) throw error;
      setBookmarkedVideos(new Set(data?.map(b => b.video_id) || []));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const handleUnlockVideo = async (videoId: string, cost: number) => {
    if (nellyCoins < cost) {
      alert('Insufficient NellyCoins. Please top up your balance.');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: nellyCoins - cost })
        .eq('id', user.id);
      if (balanceError) throw balanceError;
      setUnlockedVideos(prev => new Set([...prev, videoId]));
      setNellyCoins(nellyCoins - cost);
      alert('Video unlocked successfully!');
    } catch (error) {
      console.error('Error unlocking video:', error);
      alert('Failed to unlock video. Please try again.');
    }
  };

  const handleGiftCoins = async (amount: number) => {
    if (!selectedCreatorId) return;
    if (nellyCoins < amount) {
      alert('Insufficient NellyCoins. Please top up your balance.');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: senderError } = await supabase
        .from('users')
        .update({ balance: nellyCoins - amount })
        .eq('id', user.id);
      if (senderError) throw senderError;
      const { error: receiverError } = await supabase
        .from('users')
        .update({ balance: (await supabase.from('users').select('balance').eq('id', selectedCreatorId).single()).data?.balance + amount })
        .eq('id', selectedCreatorId);
      if (receiverError) throw receiverError;
      setNellyCoins(nellyCoins - amount);
      setShowGiftPopup(false);
      setSelectedCreatorId(null);
      alert(`Successfully sent ${amount} NellyCoins to creator!`);
    } catch (error) {
      console.error('Error gifting coins:', error);
      alert('Failed to send coins. Please try again.');
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      if (!user) {
        toast({ title: 'Login required', description: 'Please login to like videos', variant: 'destructive' });
        return;
      }
      const isLiked = likedVideos.has(videoId);
      if (isLiked) {
        setLikedVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } else {
        setLikedVideos(prev => new Set([...prev, videoId]));
      }
      const { error } = await supabase
        .from('creator_videos')
        .update({ 
          likes_count: isLiked 
            ? (videos.find(v => v.id === videoId)?.likes_count || 0) - 1
            : (videos.find(v => v.id === videoId)?.likes_count || 0) + 1
        })
        .eq('id', videoId);
      if (error) throw error;
      loadVideos();
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleBookmark = async (videoId: string) => {
    try {
      if (!user) {
        toast({ title: 'Login required', description: 'Please login to bookmark videos', variant: 'destructive' });
        return;
      }
      const isBookmarked = bookmarkedVideos.has(videoId);
      if (isBookmarked) {
        const { error } = await supabase
          .from('video_bookmarks')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);
        if (error) throw error;
        setBookmarkedVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
        toast({ title: 'Removed', description: 'Video removed from bookmarks' });
      } else {
        const { error } = await supabase
          .from('video_bookmarks')
          .insert({ video_id: videoId, user_id: user.id });
        if (error) throw error;
        setBookmarkedVideos(prev => new Set([...prev, videoId]));
        toast({ title: 'Bookmarked', description: 'Video added to bookmarks' });
      }
    } catch (error) {
      console.error('Error bookmarking video:', error);
      toast({ title: 'Error', description: 'Failed to bookmark video', variant: 'destructive' });
    }
  };

  const handleShare = async (videoId: string) => {
    const shareUrl = `${window.location.origin}/feed?videoId=${videoId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Check out this video', url: shareUrl });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Copied!', description: 'Video link copied to clipboard' });
    }
  };

  const handleComment = (videoId: string) => {
    if (!user) {
      toast({ title: 'Login required', description: 'Please login to comment', variant: 'destructive' });
      return;
    }
    setSelectedVideoId(videoId);
    setShowCommentModal(true);
  };

  const handleCreatorClick = (creatorId: string) => {
    navigate(`/profile/${creatorId}`);
  };

  const handleInboxClick = () => {
    navigate('/inbox');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <h1 className="text-white text-xl font-bold">🎬 Reels</h1>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
          <span className="text-yellow-400 font-bold">{nellyCoins}</span>
          <span className="text-white text-sm">NC</span>
        </div>
      </div>

      <div className="flex-1 relative overflow-y-auto" style={{ scrollSnapType: 'y mandatory', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
        {videos.length > 0 ? (
          <div className="relative w-full">
            {videos.map((video, index) => (
              <div key={video.id} className="relative w-full h-screen scroll-snap-start" style={{ scrollSnapAlign: 'start', height: '100vh', width: '100%' }}>
                <div className="relative w-full h-full bg-black">
                  {video.is_premium && !unlockedVideos.has(video.id) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/80 to-purple-900/80 backdrop-blur-xl">
                      <Lock className="w-16 h-16 text-yellow-400 mb-4" />
                      <h2 className="text-white text-2xl font-bold mb-2">🔒 Premium Content</h2>
                      <p className="text-gray-300 text-lg mb-6">Unlock Exclusive Premium Reel</p>
                      <Button
                        onClick={() => handleUnlockVideo(video.id, video.unlock_cost)}
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-4 px-8 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/50"
                      >
                        🔓 Unlock for {video.unlock_cost} NellyCoins
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRefsContainer.current[index]}
                        src={video.video_url}
                        className="w-full h-full object-cover"
                        muted={muted}
                        playsInline
                        loop
                        preload="metadata"
                        crossOrigin="anonymous"
                      />
                      <Button
                        onClick={() => setMuted(!muted)}
                        className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/50 transition-all z-20"
                      >
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </Button>
                      <div className="absolute bottom-24 left-4 right-20 z-10">
                        <div
                          className="flex items-center gap-3 mb-2 cursor-pointer"
                          onClick={() => handleCreatorClick(video.creator_id)}
                        >
                          <p className="text-white font-bold text-lg">{video.creator_name || 'Creator'}</p>
                        </div>
                        {video.caption && (
                          <p className="text-white font-semibold mb-2">{video.caption}</p>
                        )}
                      </div>
                      <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center z-10">
                        <Button onClick={() => handleLike(video.id)} className="bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all">
                          <Heart size={28} fill={likedVideos.has(video.id) ? 'red' : 'none'} className={likedVideos.has(video.id) ? 'text-red-500' : 'text-white'} />
                        </Button>
                        <Button onClick={() => handleComment(video.id)} className="bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all text-white">
                          <MessageCircle size={28} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-xl">No videos available</p>
          </div>
        )}
      </div>

      {showCommentModal && selectedVideoId && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedVideoId(null);
          }}
          videoId={selectedVideoId}
        />
      )}
    </div>
  );
};

export default ShortVideoFeed;
