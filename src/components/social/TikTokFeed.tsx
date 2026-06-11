import React, { useState, useRef, useEffect } from 'react';
import { useTikTokFeed } from '@/hooks/useTikTokFeed';
import VideoPlayer from './VideoPlayer';

const TikTokFeed: React.FC = () => {
  const { videos, loading, error } = useTikTokFeed();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollTop / container.clientHeight);
      setActiveIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return <div className="text-white text-center p-4">Loading feed...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-120px)] w-full overflow-y-scroll snap-y snap-mandatory"
    >
      {videos.map((video, index) => (
        <div key={video.id} className="h-full w-full snap-start">
          <VideoPlayer video={video} isActive={index === activeIndex} />
        </div>
      ))}
    </div>
  );
};

export default TikTokFeed;
