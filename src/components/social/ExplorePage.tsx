import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Heart, MessageCircle, Bookmark, Share2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  views: number;
  creator_name?: string;
  creator_avatar?: string;
  created_at: string;
}

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const pageSize = 20;

  const loadVideos = useCallback(async (pageNum: number, query: string = '') => {
    try {
      let dbQuery = supabase
        .from('creator_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (query.trim()) {
        dbQuery = dbQuery.or(`caption.ilike.%${query}%,creator_name.ilike.%${query}%`);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;

      if (pageNum === 0) {
        setVideos(data || []);
      } else {
        setVideos(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === pageSize);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadVideos(0, searchQuery);
  }, [loadVideos, searchQuery]);

  const lastVideoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          loadVideos(nextPage, searchQuery);
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadVideos, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadVideos(0, searchQuery);
  };

  const handleVideoClick = (video: CreatorVideo) => {
    navigate('/match-feed', { state: { videoId: video.id } });
  };

  const handleCreatorClick = (creatorId: string) => {
    navigate(`/profile/${creatorId}`);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="p-4">
          <h1 className="text-white text-2xl font-bold mb-4">Explore</h1>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, creators..."
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </form>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="p-4">
        {videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map((video, index) => (
              <div
                key={video.id}
                ref={index === videos.length - 1 ? lastVideoElementRef : null}
                className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                {/* Thumbnail */}
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.caption || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Play size={48} className="text-white/80" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play size={32} className="text-white fill-white" />
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {/* Creator */}
                    <div
                      className="flex items-center gap-2 mb-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreatorClick(video.creator_id);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {video.creator_name?.charAt(0) || 'C'}
                      </div>
                      <span className="text-white text-sm font-semibold truncate">
                        {video.creator_name || 'Creator'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-white text-xs">
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        <span>{video.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        <span>{video.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Badge */}
                {video.is_premium && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    Premium
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Search size={40} className="text-gray-400" />
            </div>
            <p className="text-white text-lg mb-2">No videos found</p>
            <p className="text-gray-400 text-sm">Try a different search term</p>
          </div>
        )}

        {loading && videos.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
