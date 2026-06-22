import React, { useState, useEffect } from 'react';
// Corrected import path for MatchmakingOverlay component
// Correct import path for MatchmakingOverlay component
import MatchmakingOverlay from './MatchmakingOverlay';
import { supabase } from '@/lib/supabase';
import { Volume2, VolumeX, Heart, MessageCircle, Home, Users, Plus, User, MessageSquare } from 'lucide-react';
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

const FALLBACK_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

const ShortVideoFeed = () => {
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  // Track IDs of videos that have failed to load to prevent infinite retry loops
  const [failedVideos, setFailedVideos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadVideos();
  }, []);

  // Refresh handler retained without scroll reset (containerRef removed)
  useEffect(() => {
    const handleRefresh = () => {
      loadVideos();
    };
    window.addEventListener('refresh-home-feed', handleRefresh);
    return () => window.removeEventListener('refresh-home-feed', handleRefresh);
  }, []);

  // Removed IntersectionObserver and activeIndex logic to eliminate heavy animations.

  const loadVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('creator_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) console.error("FETCH ERROR:", error);
    setVideos(data || []);
    setLoading(false);
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>,
    videoId: string,
    url: string
  ) => {
    console.error(`[Video Load Error] Failed to load video at: ${url}`, e);
    // Record the failed video URL to avoid further retries for this video
    setFailedVideos((prev) => ({ ...prev, [url]: true }));
    // No further action; the video source will be switched to fallback via render logic
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center text-white bg-black">Loading...</div>;

  return (
    // Fixed, unmovable root viewport
    <div className="w-full h-screen fixed inset-0 bg-black overflow-hidden touch-none select-none">
      {/* Centered container limited to 450px width */}
      <div className="relative w-full h-full max-w-[450px] mx-auto overflow-hidden">
        {/* Translation wrapper handling vertical slide */}
        <div className="flex flex-col w-full h-full">
          {videos.map((video) => (
            // Individual slide cell – rigid full‑screen frame
            <div
              key={video.id}
              className="w-full h-full min-h-screen relative flex-shrink-0 flex items-center justify-center bg-black overflow-hidden"
            >
                {/* 
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(video.id, el);
                    else videoRefs.current.delete(video.id);
                  }}
                  data-id={video.id}
                  src={failedVideos[video.video_url] ? FALLBACK_VIDEO_URL : encodeURI(video.video_url)}
                  className="w-full h-full max-w-full max-h-full object-contain pointer-events-none"
                  playsInline
                  loop
                  preload="auto"
                  crossOrigin="anonymous"
                  onError={(e) => handleVideoError(e, video.id, video.video_url)}
                />
                */}
          <div className="w-full h-full flex items-center justify-center bg-black text-white">Loading...</div>
              {/* UI Overlays */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-50">
                <button onClick={() => setMuted(!muted)} className="text-white">
                  {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                </button>
                <button className="text-white flex flex-col items-center gap-1">
                  <Heart size={28} />
                  <span className="text-xs">{video.likes_count}</span>
                </button>
                <button className="text-white flex flex-col items-center gap-1">
                  <MessageCircle size={28} />
                  <span className="text-xs">{video.comments_count}</span>
                </button>
              </div>
              <div className="absolute left-4 bottom-20 z-50 text-white">
                <h3 className="font-bold text-lg">@{video.creator_name || 'Creator'}</h3>
                <p className="text-sm truncate">{video.caption || 'No caption'}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Bottom navigation – pinned inside the 450px slot */}
        <div className="max-w-[450px] mx-auto absolute bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/10 p-4 flex justify-between items-center text-white">
          <button className="flex flex-col items-center gap-1"><Home size={24} /></button>
          <button className="flex flex-col items-center gap-1"><Users size={24} /></button>
          <button className="flex items-center justify-center w-12 h-9 bg-white rounded-lg border-2 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            <Plus size={24} className="text-black" />
          </button>
          <button className="flex flex-col items-center gap-1"><MessageSquare size={24} /></button>
          <button onClick={() => window.location.href = '/me'} className="flex flex-col items-center gap-1"><User size={24} /></button>
        </div>
      </div>
      {/* Floating HUD button */}
      <button
        onClick={() => setShowOverlay(true)}
        className="fixed top-4 right-4 z-50 bg-black/70 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-lg"
      >
        Switch to Dating Cockpit 🎯
      </button>
      {/* Matchmaking overlay */}
      {showOverlay && <MatchmakingOverlay onClose={() => setShowOverlay(false)} />}
    </div>
  );
};

export default ShortVideoFeed;
