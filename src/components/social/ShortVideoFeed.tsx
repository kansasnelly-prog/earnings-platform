import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Gift, Volume2, VolumeX, Lock, Home, UserPlus, Plus, MessageSquare, User, Bookmark, Share2, Compass } from 'lucide-react';
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

const ShortVideoFeed = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);
  const [muted, setMuted] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<React.RefObject<HTMLVideoElement>[]>([]);
  const touchStartY = useRef(0);

  useEffect(() => {
    loadVideos();
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (videos.length > 0 && videoRefs.current[activeIndex]?.current) {
      const videoElement = videoRefs.current[activeIndex].current!;
      setTimeout(() => {
        videoElement.muted = muted;
        videoElement.play().catch(console.error);
      }, 200);
    }
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black">
      <div 
        ref={containerRef}
        className="h-screen w-full overflow-y-hidden"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className={`h-screen w-full relative ${activeIndex === index ? 'block' : 'hidden'}`}>
            <video
              ref={videoRefs.current[index]}
              src={video.video_url}
              className="w-full h-full object-cover"
              playsInline
              loop
              controls
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortVideoFeed;
