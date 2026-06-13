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
}

const GIFTS: GiftType[] = [
  { id: 'gift1', name: 'Rose', coin_cost: 10 },
  { id: 'gift2', name: 'Heart', coin_cost: 50 },
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, isActive }) => {
  console.log('[VideoPlayer] COMPONENT RENDERED');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAppContext();
  const { isLiked, likesCount, toggleLike, isFollowing, toggleFollow } = useEngagement(video.id, user?.id || '', video.creator_id);
  const { balance, sendGift } = useCreatorEconomy(user?.id || '');
  const [showGifts, setShowGifts] = useState(false);

  // ---------- navigation helpers ----------
  const navigate = useNavigate();
  const handleOpenComments = () => navigate(`/video/${video.id}/comments`);
  const handleOpenShare = () => navigate(`/video/${video.id}/share`);
  const handleOpenProfile = () => navigate(`/profile/${video.creator_id}`);

  useEffect(() => {
    console.log(`[VideoPlayer] EFFECT - isActive: ${isActive}, video.id: ${video.id}, video.url: ${video.video_url}`);
    if (isActive) {
      console.log(`[VideoPlayer] Attempting play() for ${video.id}`);
      videoRef.current?.play()
        .then(() => console.log('[VideoPlayer] PLAY SUCCESS for', video.id))
        .catch(err => console.error('[VideoPlayer] PLAY FAILED for', video.id, err));
    } else {
      console.log(`[VideoPlayer] Pausing ${video.id}`);
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isActive, video.id, video.video_url]);

  const handleCanPlay = () => {
    console.log(`[VideoPlayer] canPlay event for ${video.id}`);
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
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-cover pointer-events-none"
          loop
          muted
          playsInline
          autoPlay
          onCanPlay={handleCanPlay}
        />
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
