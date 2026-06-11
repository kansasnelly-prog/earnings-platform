import React, { useState, useRef, useEffect } from 'react';
import { useTikTokFeed } from '@/hooks/useTikTokFeed';
import VideoPlayer from './VideoPlayer';
import VideoUpload from './VideoUpload';

const TikTokFeed: React.FC = () => {
  console.log('[TikTokFeed] COMPONENT RENDERED');
  const { videos, loading, fetchVideos } = useTikTokFeed();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Autoplay logic
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeIndex) {
      console.log(`[TikTokFeed] activeIndex changed: ${activeIndex} -> ${index}`);
      setActiveIndex(index);
    }

    // Infinite scroll logic
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
      if (!loading && videos.length > 0) {
        fetchVideos(videos[videos.length - 1].created_at);
      }
    }
  };

  return (
    <div className="relative h-full">
      <button onClick={() => setShowUpload(!showUpload)} className="absolute top-4 right-4 z-50 bg-indigo-600 text-white p-2 rounded-lg">Upload</button>
      {showUpload && <VideoUpload />}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-120px)] w-full overflow-y-scroll snap-y snap-mandatory"
      >
        {videos.map((video, index) => (
          <div key={video.id} className="h-full w-full snap-start">
            <VideoPlayer video={video} isActive={index === activeIndex} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TikTokFeed;
