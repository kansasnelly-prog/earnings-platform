import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Volume2, VolumeX, Heart, MessageCircle } from 'lucide-react';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      setActiveIndex(0);
      loadVideos();
    };
    window.addEventListener('refresh-home-feed', handleRefresh);
    return () => window.removeEventListener('refresh-home-feed', handleRefresh);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          const videoId = videoElement.dataset.id;
          
          if (entry.isIntersecting) {
            videoElement.muted = muted;
            videoElement.play().catch(() => {});
            if (videoId) {
              const videoIndex = videos.findIndex(v => v.id === videoId);
              setActiveIndex(videoIndex);
            }
          } else {
            videoElement.pause();
            videoElement.currentTime = 0;
          }
        });
      },
      { threshold: 0.8 } // 80% visibility required to trigger
    );

    videoRefs.current.forEach((video) => {
      observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos, muted]);

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

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>, url: string) => {
    console.error(`[Video Load Error] Failed to load video at: ${url}`, e);
    const video = e.currentTarget;
    video.src = FALLBACK_VIDEO_URL;
    video.load();
    video.play().catch(() => {});
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center text-white bg-black">Loading...</div>;

  return (
    <div 
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black" 
      ref={containerRef}
    >
      {videos.map((video) => (
          <div key={video.id} className="w-full h-screen relative bg-black flex flex-col justify-between overflow-hidden select-none">
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(video.id, el);
                else videoRefs.current.delete(video.id);
              }}
              data-id={video.id}
              src={video.video_url}
              className="w-full h-auto max-h-full object-contain"
              playsInline
              loop
              preload="auto"
              crossOrigin="anonymous"
              onError={(e) => handleVideoError(e, video.video_url)}
            />
            </div>
          
          {/* Always Rendered UI Overlays */}
            <div className="absolute right-3 bottom-[180px] flex flex-col items-center gap-5 z-50">
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

            <div className="absolute left-4 bottom-[100px] right-[80px] z-50 text-white flex flex-col gap-2 text-left">
            <h3 className="font-bold text-lg">@{video.creator_name || 'Creator'}</h3>
            <p className="text-sm truncate">{video.caption || 'No caption'}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShortVideoFeed;
