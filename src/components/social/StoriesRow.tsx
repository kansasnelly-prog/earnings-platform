import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  expires_at: string;
  created_at: string;
  viewer_count: number;
  username?: string;
  avatar_url?: string;
}

const StoriesRow: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Get stories from other users (not expired)
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          users!stories_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform data to include username and avatar
      const transformedStories = (data || []).map((story: any) => ({
        ...story,
        username: story.users?.display_name || 'Unknown',
        avatar_url: story.users?.avatar_url
      }));

      setStories(transformedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = async (story: Story) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Mark story as viewed
      await supabase
        .from('story_views')
        .insert({
          story_id: story.id,
          viewer_id: user.id
        });

      // Navigate to story viewer
      navigate(`/story/${story.id}`);
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  };

  const handleAddStory = () => {
    navigate('/create-story');
  };

  if (loading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-800 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide">
      {/* Add Story Button */}
      <button
        onClick={handleAddStory}
        className="flex-shrink-0 flex flex-col items-center gap-1"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <Plus size={24} className="text-white" />
          </div>
        </div>
        <span className="text-white text-xs">Add Story</span>
      </button>

      {/* Stories */}
      {stories.map((story) => (
        <button
          key={story.id}
          onClick={() => handleStoryClick(story)}
          className="flex-shrink-0 flex flex-col items-center gap-1"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
            <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden">
              {story.thumbnail_url ? (
                <img
                  src={story.thumbnail_url}
                  alt={story.username}
                  className="w-full h-full object-cover"
                />
              ) : story.avatar_url ? (
                <img
                  src={story.avatar_url}
                  alt={story.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                  {story.username?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>
          <span className="text-white text-xs truncate w-16 text-center">
            {story.username}
          </span>
        </button>
      ))}
    </div>
  );
};

export default StoriesRow;
