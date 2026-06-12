import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';
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

const ShortVideoFeed = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<React.RefObject<HTMLVideoElement>[]>([]);
  const touchStartY = useRef(0);

  useEffect(() => {
    loadVideos();
  }, []);

  // Play/Pause management
  useEffect(() => {
    videoRefs.current.forEach((ref, index) => {
      const video = ref.current;
      if (!video) return;
      if (index === activeIndex) {
        video.muted = muted;
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex, videos, muted]);

  // Gesture handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 20) setActiveIndex(prev => Math.min(prev + 1, videos.length - 1));
      else if (e.deltaY < -20) setActiveIndex(prev => Math.max(prev - 1, 0));
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (deltaY > 50) setActiveIndex(prev => Math.min(prev + 1, videos.length - 1));
      else if (deltaY < -50) setActiveIndex(prev => Math.max(prev - 1, 0));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [videos.length]);

  const loadVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('creator_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) console.error("FETCH ERROR:", error);
    setVideos(data || []);
    videoRefs.current = Array.from({ length: data?.length || 0 }, () => React.createRef<HTMLVideoElement>());
    setLoading(false);
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center text-white bg-black">Loading...</div>;

  return (
    <div className="h-screen w-full overflow-hidden bg-black" ref={containerRef}>
      <div 
        className="transition-transform duration-300 ease-out h-full w-full"
        style={{ transform: `translateY(-${activeIndex * 100}vh)` }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="h-screen w-full relative flex items-center justify-center">
            <video
              ref={videoRefs.current[index]}
              src={video.video_url}
              className="w-full h-full object-cover"
              playsInline
              loop
            />
            <button
              onClick={() => setMuted(!muted)}
              className="absolute top-4 right-4 z-20 text-white"
            >
              {muted ? <VolumeX /> : <Volume2 />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortVideoFeed;
