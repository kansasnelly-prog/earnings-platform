import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Gift, Volume2, VolumeX, Lock, ChevronRight } from 'lucide-react';

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
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<string>>(new Set());
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    loadVideos();
    loadUserBalance();
  }, []);

  useEffect(() => {
    // Auto-play current video
    if (videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex]?.play().catch(() => {});
    }
  }, [currentIndex]);

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

  const handleUnlockVideo = async (videoId: string, cost: number) => {
    if (nellyCoins < cost) {
      alert('Insufficient NellyCoins. Please top up your balance.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deduct coins
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: nellyCoins - cost })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Add to unlocked set
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

      // Deduct from sender
      const { error: senderError } = await supabase
        .from('users')
        .update({ balance: nellyCoins - amount })
        .eq('id', user.id);

      if (senderError) throw senderError;

      // Add to creator's balance
      const { error: receiverError } = await supabase
        .from('users')
        .update({ balance: (await supabase.from('users').select('balance').eq('id', selectedCreatorId).single()).data?.balance || 0 + amount })
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      // Update likes count in database
      const { error } = await supabase
        .from('creator_videos')
        .update({ 
          likes_count: isLiked 
            ? (videos.find(v => v.id === videoId)?.likes_count || 0) - 1
            : (videos.find(v => v.id === videoId)?.likes_count || 0) + 1
        })
        .eq('id', videoId);

      if (error) throw error;

      // Reload videos to get updated counts
      loadVideos();
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentVideo = videos[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <h1 className="text-white text-xl font-bold">🎬 Reels</h1>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
          <span className="text-yellow-400 font-bold">{nellyCoins}</span>
          <span className="text-white text-sm">NC</span>
        </div>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative overflow-hidden">
        {currentVideo ? (
          <div className="relative w-full h-full">
            {/* Video Player */}
            <div className="relative w-full h-full bg-black">
              {currentVideo.is_premium && !unlockedVideos.has(currentVideo.id) ? (
                /* Premium Paywall */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/80 to-purple-900/80 backdrop-blur-xl">
                  <Lock className="w-16 h-16 text-yellow-400 mb-4" />
                  <h2 className="text-white text-2xl font-bold mb-2">🔒 Premium Content</h2>
                  <p className="text-gray-300 text-lg mb-6">Unlock Exclusive Premium Reel</p>
                  <Button
                    onClick={() => handleUnlockVideo(currentVideo.id, currentVideo.unlock_cost)}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-4 px-8 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/50"
                  >
                    🔓 Unlock for {currentVideo.unlock_cost} NellyCoins
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={el => videoRefs.current[currentIndex] = el}
                    src={currentVideo.video_url}
                    className="w-full h-full object-cover"
                    loop
                    muted={muted}
                    onClick={() => {
                      const video = videoRefs.current[currentIndex];
                      if (video) {
                        if (video.paused) {
                          video.play();
                        } else {
                          video.pause();
                        }
                      }
                    }}
                  />
                  
                  {/* Mute Toggle */}
                  <Button
                    onClick={() => setMuted(!muted)}
                    className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/50 transition-all"
                  >
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </Button>

                  {/* Creator Info */}
                  <div className="absolute bottom-20 left-4 right-20">
                    <div className="flex items-center gap-3 mb-3">
                      {currentVideo.creator_avatar && (
                        <img
                          src={currentVideo.creator_avatar}
                          alt={currentVideo.creator_name}
                          className="w-10 h-10 rounded-full border-2 border-white"
                        />
                      )}
                      <div>
                        <p className="text-white font-semibold">{currentVideo.creator_name || 'Creator'}</p>
                        <p className="text-gray-300 text-sm">@{currentVideo.creator_id}</p>
                      </div>
                    </div>
                    {currentVideo.caption && (
                      <p className="text-white text-sm mb-2">{currentVideo.caption}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                    <Button
                      onClick={() => handleLike(currentVideo.id)}
                      className={`bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all ${
                        likedVideos.has(currentVideo.id) ? 'text-red-500' : 'text-white'
                      }`}
                    >
                      <Heart size={24} fill={likedVideos.has(currentVideo.id) ? 'currentColor' : 'none'} />
                    </Button>
                    <p className="text-white text-xs text-center">{currentVideo.likes_count}</p>
                    
                    <Button className="bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all text-white">
                      <MessageCircle size={24} />
                    </Button>
                    <p className="text-white text-xs text-center">{currentVideo.comments_count}</p>
                    
                    <Button
                      onClick={() => {
                        setSelectedCreatorId(currentVideo.creator_id);
                        setShowGiftPopup(true);
                      }}
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 p-3 rounded-full hover:scale-105 transition-all text-white shadow-lg"
                    >
                      <Gift size={24} />
                    </Button>
                    <p className="text-white text-xs text-center">Gift</p>
                  </div>
                </>
              )}
            </div>

            {/* Navigation Hints */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                onClick={() => handleScroll('up')}
                disabled={currentIndex === 0}
                className="bg-black/30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/50 transition-all disabled:opacity-30"
              >
                <ChevronRight size={20} className="rotate-[-90deg]" />
              </Button>
              <Button
                onClick={() => handleScroll('down')}
                disabled={currentIndex === videos.length - 1}
                className="bg-black/30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/50 transition-all disabled:opacity-30"
              >
                <ChevronRight size={20} className="rotate-[90deg]" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-xl">No videos available</p>
          </div>
        )}
      </div>

      {/* Gift Popup */}
      {showGiftPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-xl border-2 border-yellow-500/30 p-6 w-80">
            <h3 className="text-white text-xl font-bold mb-4 text-center">🎁 Gift Coins to Creator</h3>
            <div className="space-y-3">
              <Button
                onClick={() => handleGiftCoins(10)}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                10 NellyCoins
              </Button>
              <Button
                onClick={() => handleGiftCoins(50)}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                50 NellyCoins
              </Button>
              <Button
                onClick={() => handleGiftCoins(100)}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                100 NellyCoins
              </Button>
              <Button
                onClick={() => {
                  setShowGiftPopup(false);
                  setSelectedCreatorId(null);
                }}
                className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShortVideoFeed;
