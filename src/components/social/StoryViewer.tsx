import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, X, Send } from 'lucide-react';

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

const StoryViewer: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (storyId) {
      loadStory();
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [storyId]);

  useEffect(() => {
    if (story && videoRef.current) {
      videoRef.current.play();
      startProgress();
    }
  }, [story]);

  const loadStory = async () => {
    try {
      if (!storyId) return;

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          users!stories_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;

      const transformedStory = {
        ...data,
        username: data.users?.display_name || 'Unknown',
        avatar_url: data.users?.avatar_url
      };

      setStory(transformedStory);
    } catch (error) {
      console.error('Error loading story:', error);
    } finally {
      setLoading(false);
    }
  };

  const startProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setProgress(0);
    const duration = 10000; // 10 seconds per story
    const interval = 100;
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          navigate('/inbox');
          return 100;
        }
        return prev + increment;
      });
    }, interval);
  };

  const handleSendComment = async () => {
    if (!comment.trim() || !story || sending) return;

    try {
      setSending(true);
      // This would send a comment to the story
      // For now, just clear the input
      setComment('');
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    navigate('/inbox');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Story not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            {story.avatar_url ? (
              <img
                src={story.avatar_url}
                alt={story.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {story.username?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{story.username}</p>
              <p className="text-gray-400 text-xs">
                {new Date(story.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Story Content */}
      <div className="flex-1 relative">
        {story.media_url.endsWith('.mp4') || story.media_url.endsWith('.mov') ? (
          <video
            ref={videoRef}
            src={story.media_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={false}
            playsInline
          />
        ) : (
          <img
            src={story.media_url}
            alt={story.caption || 'Story'}
            className="w-full h-full object-cover"
          />
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg p-3">
              {story.caption}
            </p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={sending}
          />
          <button
            onClick={handleSendComment}
            disabled={!comment.trim() || sending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
