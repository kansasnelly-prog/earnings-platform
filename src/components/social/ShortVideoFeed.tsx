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
  useEffect(() => {
    console.log("SHORTVIDEOFEED MOUNT SUCCESS");
  }, []);

  const navigate = useNavigate();
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);
  const videoRefs = useRef<React.RefObject<HTMLVideoElement>[]>([]);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      console.log("VIDEOS FETCHED:", videos.length);
      console.log("FIRST VIDEO:", videos[0]);
      console.log("VIDEO URL:", videos[0]?.video_url);
      
      videoRefs.current = Array.from({ length: videos.length }, () => React.createRef<HTMLVideoElement>());
    }
  }, [videos]);

  useEffect(() => {
    if (videos.length > 0 && videoRefs.current[activeIndex]?.current) {
      const videoElement = videoRefs.current[activeIndex].current;
      console.log("VIDEO ELEMENT:", videoElement);
      
      videoElement.muted = true;
      videoElement.play()
        .then(() => console.log("AUTOPLAY SUCCESS"))
        .catch(err => console.error("AUTOPLAY FAILED", err));
    }
  }, [activeIndex, videos]);

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

  const handleEnded = () => {
    console.log("VIDEO ENDED");
    setActiveIndex(prev => prev + 1);
  };

  useEffect(() => {
    console.log("ACTIVE INDEX:", activeIndex);
  }, [activeIndex]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black">
      {videos.map((video, index) => (
        <div key={video.id} className="h-screen w-full snap-start relative">
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
  );
};

export default ShortVideoFeed;
