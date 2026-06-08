import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Gift, Volume2, VolumeX, Lock, Home, UserPlus, Plus, MessageSquare, User, Bookmark, Share2, MapPin } from 'lucide-react';
import { useTikTokAutoplay } from '@/hooks/useTikTokAutoplay';
import { useAppContext } from '@/contexts/AppContext';

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
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<string>>(new Set());
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  
  // Stable ref wrapper to prevent React error #321
  const videoRefsContainer = useRef<React.RefObject<HTMLVideoElement>[]>([]);
  
  useEffect(() => {
    loadVideos();
    loadUserBalance();
  }, []);

  // Initialize refs for each video - stable implementation
  useEffect(() => {
    // Only update the array contents, not the container reference
    while (videoRefsContainer.current.length < videos.length) {
      videoRefsContainer.current.push(useRef<HTMLVideoElement>(null));
    }
    while (videoRefsContainer.current.length > videos.length) {
      videoRefsContainer.current.pop();
    }
  }, [videos]);

  // Use TikTok autoplay hook with stable ref container
  useTikTokAutoplay(videoRefsContainer);

  // ===========================================
  // MODULE 2 & 3: ADMIN MINTING ENGINE & TELEGRAM TRANSMITTER
  // ===========================================
  const [mintingAnimations, setMintingAnimations] = useState<number[]>([]);
  const mintedCoinsRef = useRef(0);
  const telegramAlertTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only activate for admin user
    if (user?.email !== 'Technicalverified@gmail.com') {
      return;
    }

    // 30-second minting timer
    const mintingInterval = setInterval(async () => {
      // Check visibility to prevent background execution
      if (document.hidden) {
        return;
      }

      try {
        // Atomic database transaction to add 1 NellyCoin
        const { error } = await supabase
          .rpc('increment_nellycoins', { user_email: 'Technicalverified@gmail.com' });

        if (error) {
          console.error('Minting error:', error);
          return;
        }

        // Trigger floating text animation
        const animationId = Date.now();
        setMintingAnimations(prev => [...prev, animationId]);
        setTimeout(() => {
          setMintingAnimations(prev => prev.filter(id => id !== animationId));
        }, 2000);

        // Track minted coins for Telegram alerts
        mintedCoinsRef.current += 1;

        // Send Telegram alert every 60 seconds (every 2 coins)
        if (mintedCoinsRef.current % 2 === 0) {
          const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
          const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
          
          if (token && chatId) {
            const message = `🚨 TIKTOK6 TREASURY ALERTER:\n[ADMIN MINTER ACTIVE]\nUser: Technicalverified@gmail.com\nStatus: Solar Panel Engine Burning\nTokens Generated: +2 NellyCoins\nNew Cash Valuation: +$1.00 USD\nTreasury Balance Updated Successfully ✅`;
            
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
              })
            }).catch(err => console.error('Telegram alert error:', err));
          }
        }

        // Update local balance display
        setNellyCoins(prev => prev + 1);
      } catch (error) {
        console.error('Minting error:', error);
      }
    }, 30000); // 30-second interval

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause minting when tab is hidden
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(mintingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.email]);


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
      <div className="flex-1 relative overflow-y-auto scroll-snap-type-y-mandatory" style={{ scrollSnapType: 'y mandatory', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
        {videos.length > 0 ? (
          <div className="relative w-full">
            {videos.map((video, index) => (
              <div key={video.id} className="relative w-full h-screen scroll-snap-start" style={{ scrollSnapAlign: 'start', height: '100vh', width: '100%' }}>
                {/* Video Player */}
                <div className="relative w-full h-full bg-black">
                  {video.is_premium && !unlockedVideos.has(video.id) ? (
                    /* Premium Paywall */
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
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        crossOrigin="anonymous"
                        onClick={() => {
                          const videoEl = videoRefsContainer.current[index].current;
                          if (videoEl) {
                            if (videoEl.paused) {
                              videoEl.play().catch(() => {});
                            } else {
                              videoEl.pause();
                            }
                          }
                        }}
                      />
                      
                      {/* Top Notification Banner */}
                      <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          OD
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">Obong Declan, DROP_BOI sent you new messages.</p>
                        </div>
                        <Button className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all">
                          Reply
                        </Button>
                      </div>

                      {/* Mute Toggle */}
                      <Button
                        onClick={() => setMuted(!muted)}
                        className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/50 transition-all z-20"
                      >
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </Button>

                      {/* Lower-Left Metadata Metrics */}
                      <div className="absolute bottom-24 left-4 right-20 z-10">
                        {/* Status Badge */}
                        <div className="mb-2">
                          <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-semibold">
                            Your friend
                          </span>
                        </div>
                        
                        {/* Creator Info */}
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-bold text-lg">{video.creator_name || 'Creator'}</p>
                        </div>
                        
                        {/* Location Tag */}
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={14} className="text-white" />
                          <p className="text-white text-sm">ខ្មែរក្រហម - Angkol beach - n.a. (1564)</p>
                        </div>
                        <p className="text-gray-300 text-xs mb-3">7.0M likes on posts of this place</p>
                        
                        {/* Typography Text Lines */}
                        <p className="text-white font-semibold mb-1">Jani Fyy ❤️👩‍❤️‍👨📃 Photo</p>
                        <p className="text-white text-sm mb-2">#Me @24h 🌞 #fan</p>
                        <p className="text-gray-400 text-xs mb-1">Paid partnership</p>
                        <p className="text-gray-400 text-xs">Creator labeled as AI-generated</p>
                      </div>

                      {/* Right-Hand Floating Engagement Column */}
                      <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center z-10">
                        {/* Creator Avatar with Follow */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white">
                            {video.creator_name?.charAt(0) || 'C'}
                          </div>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full p-1">
                            <UserPlus size={12} className="text-white" />
                          </div>
                        </div>
                        
                        {/* Like */}
                        <div className="flex flex-col items-center">
                          <Button
                            onClick={() => handleLike(video.id)}
                            className={`bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all ${
                              likedVideos.has(video.id) ? 'text-red-500' : 'text-white'
                            }`}
                          >
                            <Heart size={28} fill={likedVideos.has(video.id) ? 'currentColor' : 'none'} />
                          </Button>
                          <p className="text-white text-xs font-semibold mt-1">24</p>
                        </div>
                        
                        {/* Comment */}
                        <div className="flex flex-col items-center">
                          <Button className="bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all text-white">
                            <MessageCircle size={28} />
                          </Button>
                          <p className="text-white text-xs font-semibold mt-1">6</p>
                        </div>
                        
                        {/* Bookmark */}
                        <div className="flex flex-col items-center">
                          <Button className="bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all text-white">
                            <Bookmark size={28} />
                          </Button>
                          <p className="text-white text-xs font-semibold mt-1">2</p>
                        </div>
                        
                        {/* Share */}
                        <div className="flex flex-col items-center">
                          <Button className="bg-black/30 backdrop-blur-sm p-3 rounded-full hover:bg-black/50 transition-all text-white">
                            <Share2 size={28} />
                          </Button>
                          <p className="text-white text-xs font-semibold mt-1">4</p>
                        </div>
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

      {/* Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 px-2 py-3 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Home - Active */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <Home size={24} className="text-white" />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            </div>
            <span className="text-white text-xs font-semibold">Home</span>
          </div>
          
          {/* Friends - Badge 59 */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <UserPlus size={24} className="text-white" />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">59</span>
            </div>
            <span className="text-white text-xs">Friends</span>
          </div>
          
          {/* Center Publish Button */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
          </div>
          
          {/* Inbox - Badge 83 */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <MessageSquare size={24} className="text-white" />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">83</span>
            </div>
            <span className="text-white text-xs">Inbox</span>
          </div>
          
          {/* Profile */}
          <div className="flex flex-col items-center gap-1">
            <User size={24} className="text-white" />
            <span className="text-white text-xs">Profile</span>
          </div>
        </div>
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

      {/* Floating Minting Animations */}
      {mintingAnimations.map((id) => (
        <div
          key={id}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            animation: 'floatUp 2s ease-out forwards'
          }}
        >
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-2xl px-6 py-3 rounded-full shadow-lg shadow-green-500/50">
            +1 NC Minted ✨
          </div>
        </div>
      ))}

      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default ShortVideoFeed;
