import React, { useRef, useEffect, useState } from 'react';
import { Video } from '@/hooks/useTikTokFeed';
import { Heart, MessageCircle, Share2, UserPlus, Gift } from 'lucide-react';
import { useEngagement } from '@/hooks/useEngagement';
import { useCreatorEconomy, Gift as GiftType } from '@/hooks/useCreatorEconomy';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
  // Optional callback to inform parent component of a video load error
  onError?: () => void;
}

const GIFTS: GiftType[] = [
  { id: 'gift1', name: 'Rose', coin_cost: 10 },
  { id: 'gift2', name: 'Heart', coin_cost: 50 },
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, isActive, onError }) => {
  console.log('[VideoPlayer] COMPONENT RENDERED');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAppContext();
  const { isLiked, likesCount, toggleLike, isFollowing, toggleFollow } = useEngagement(video.id, user?.id || '', video.creator_id);
  const { balance, sendGift } = useCreatorEconomy(user?.id || '');
  const [showGifts, setShowGifts] = useState(false);
  // Track if this video encountered a load error
  const [hasError, setHasError] = useState(false);

  const navigate = useNavigate();
  const handleOpenComments = () => navigate(`/video/${video.id}/comments`);
  const handleOpenShare = () => navigate(`/video/${video.id}/share`);
  const handleOpenProfile = () => navigate(`/profile/${video.creator_id}`);

  // Reset error state when the video source changes
  useEffect(() => {
    setHasError(false);
  }, [video.id]);

  // Play/pause handling based on active state
  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(err => {
        console.error('[VideoPlayer] PLAY FAILED for', video.id, err);
        // Do not set error here; playback failure is not a load error
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`[VideoPlayer] Error event for ${video.id}:`, e);
    setHasError(true);
    if (onError) onError();
  };

  const handleSendGift = async (gift: GiftType) => {
    try {
      await sendGift(video.creator_id, gift);
      setShowGifts(false);
      alert(`Gift sent: ${gift.name}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
        {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-6 text-center text-white">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/10">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m10 9 5 3-5 3Z" />
                    </svg>
                </div>
                <p className="font-medium">Video unavailable</p>
                <p className="mt-1 text-xs text-white/70">The video could not be loaded.</p>
            </div>
        ) : (
            <video
              ref={videoRef}
              src={video.video_url}
              className="w-full h-full object-cover pointer-events-none"
              loop
              muted
              playsInline
              autoPlay
              crossOrigin="anonymous"
              onError={handleError}
            />
        )}
      {/* Right Engagement Controls */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
        <button className="flex flex-col items-center" onClick={toggleLike} onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();toggleLike();}}>
          <Heart size={30} className={isLiked ? 'text-red-500 fill-red-500' : 'text-white'} />
          <span className="text-xs text-white">{likesCount}</span>
        </button>
        <button className="flex flex-col items-center" onClick={handleOpenComments} onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();handleOpenComments();}}>
          <MessageCircle size={30} className="text-white" />
          <span className="text-xs text-white">{video.comments_count}</span>
        </button>
        <button className="flex flex-col items-center" onClick={() => setShowGifts(!showGifts)} onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();setShowGifts(!showGifts);}}>
          <Gift size={30} className="text-white" />
        </button>
        <button className="flex flex-col items-center" onClick={handleOpenShare} onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();handleOpenShare();}}>
          <Share2 size={30} className="text-white" />
        </button>
        <button className="flex flex-col items-center" onClick={toggleFollow} onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();toggleFollow();}}>
          <UserPlus size={30} className={isFollowing ? 'text-green-500' : 'text-white'} />
        </button>
      </div>
      
      {/* Gift Modal */}
      {showGifts && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
          <h3 className="mb-4 text-xl">Balance: {balance} coins</h3>
          {GIFTS.map(gift => (
            <button key={gift.id} className="bg-white/10 p-4 mb-2 rounded w-full" onClick={() => handleSendGift(gift)}>
              {gift.name} - {gift.coin_cost} coins
            </button>
          ))}
          <button className="mt-4 text-gray-400" onClick={() => setShowGifts(false)}>Close</button>
        </div>
      )}
      
      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 text-white">
        <p className="font-bold cursor-pointer" onClick={handleOpenProfile} onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();handleOpenProfile();}}>@{video.creator_name}</p>
        <p className="text-sm">{video.caption}</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
