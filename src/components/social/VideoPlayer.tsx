import React, { useRef, useEffect } from 'react';
import { Video } from '@/hooks/useTikTokFeed';
import { Heart, MessageCircle, Share2, UserPlus } from 'lucide-react';
import { useEngagement } from '@/hooks/useEngagement';
import { useAppContext } from '@/contexts/AppContext';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAppContext();
  const { isLiked, likesCount, toggleLike, isFollowing, toggleFollow } = useEngagement(video.id, user?.id || '', video.creator_id);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(console.error);
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={video.video_url}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
      />
      {/* Right Engagement Controls */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center">
        <button className="flex flex-col items-center" onClick={toggleLike}>
          <Heart size={30} className={isLiked ? 'text-red-500 fill-red-500' : 'text-white'} />
          <span className="text-xs text-white">{likesCount}</span>
        </button>
        <button className="flex flex-col items-center">
          <MessageCircle size={30} className="text-white" />
          <span className="text-xs text-white">{video.comments_count}</span>
        </button>
        <button className="flex flex-col items-center">
          <Share2 size={30} className="text-white" />
        </button>
        <button className="flex flex-col items-center" onClick={toggleFollow}>
          <UserPlus size={30} className={isFollowing ? 'text-green-500' : 'text-white'} />
        </button>
      </div>
      
      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 text-white">
        <p className="font-bold">@{video.creator_name}</p>
        <p className="text-sm">{video.caption}</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
