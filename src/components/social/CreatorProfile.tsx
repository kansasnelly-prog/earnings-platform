import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Heart, MessageCircle, Bookmark, Share2, UserPlus, UserMinus, MapPin, Calendar, MessageSquare, ArrowLeft, Bell, Settings, Link as LinkIcon, Play, Eye, Lock, Music, Sparkles, Repeat, Grid3X3, Globe, Lock as LockIcon, Pin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  verified: boolean;
  followers_count: number;
  following_count: number;
  likes_count: number;
  videos_count: number;
  website_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  creator_badges?: string[];
  is_private?: boolean;
  profile_views_count?: number;
  created_at: string;
}

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
  duration?: number;
  is_private?: boolean;
  created_at: string;
}

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  expires_at: string;
  created_at: string;
}

interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_story_id?: string;
  position: number;
}

interface TikTokStudio {
  id: string;
  user_id: string;
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  total_followers_gained: number;
  total_revenue: number;
  profile_completion_score: number;
  last_updated: string;
}

interface CreatorSubscription {
  id: string;
  creator_id: string;
  subscriber_id: string;
  tier: string;
  monthly_price: number;
  started_at: string;
  expires_at?: string;
  is_active: boolean;
}

const CreatorProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [pinnedVideos, setPinnedVideos] = useState<CreatorVideo[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'pinned' | 'likes' | 'private' | 'studio' | 'subscriptions'>('videos');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [studioData, setStudioData] = useState<TikTokStudio | null>(null);
  const [subscriptions, setSubscriptions] = useState<CreatorSubscription[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile(userId);
      loadVideos(userId);
      loadPinnedVideos(userId);
      loadStories(userId);
      loadStoryHighlights(userId);
      loadStudioData(userId);
      loadSubscriptions(userId);
      checkFollowStatus(userId);
      checkSubscriptionStatus(userId);
      trackProfileView(userId);
    }
  }, [userId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    // Subscribe to video changes
    const videosSubscription = supabase
      .channel(`videos-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_videos',
          filter: `creator_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadVideos(userId);
          } else if (payload.eventType === 'DELETE') {
            loadVideos(userId);
          }
        }
      )
      .subscribe();

    // Subscribe to follow changes
    const followSubscription = supabase
      .channel(`follows-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `following_id=eq.${userId}`,
        },
        (payload) => {
          if (user) {
            checkFollowStatus(userId);
          }
          loadProfile(userId); // Update follower count
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      videosSubscription.unsubscribe();
      followSubscription.unsubscribe();
    };
  }, [userId, user]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('creator_videos')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadPinnedVideos = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pinned_videos')
        .select(`
          *,
          creator_videos(*)
        `)
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;
      setPinnedVideos(data?.map(p => p.creator_videos).filter(Boolean) || []);
    } catch (error) {
      console.error('Error loading pinned videos:', error);
    }
  };

  const loadStories = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
      setHasActiveStory((data || []).length > 0);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const loadStoryHighlights = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('story_highlights')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;
      setStoryHighlights(data || []);
    } catch (error) {
      console.error('Error loading story highlights:', error);
    }
  };

  const trackProfileView = async (profileUserId: string) => {
    if (!user) return;
    if (user.id === profileUserId) return; // Don't track own views

    try {
      await supabase
        .from('profile_views')
        .insert({
          profile_user_id: profileUserId,
          viewer_id: user.id,
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const loadStudioData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tiktok_studio')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStudioData(data || null);
    } catch (error) {
      console.error('Error loading studio data:', error);
    }
  };

  const loadSubscriptions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const checkSubscriptionStatus = async (creatorId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('subscriber_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !userId) return;

    try {
      if (isSubscribed) {
        const { error } = await supabase
          .from('creator_subscriptions')
          .update({ is_active: false })
          .eq('creator_id', userId)
          .eq('subscriber_id', user.id);

        if (error) throw error;
        setIsSubscribed(false);
        toast({ title: 'Unsubscribed', description: 'You have unsubscribed from this creator' });
      } else {
        const { error } = await supabase
          .from('creator_subscriptions')
          .insert({
            creator_id: userId,
            subscriber_id: user.id,
            tier: 'standard',
            monthly_price: 0,
            is_active: true,
          });

        if (error) throw error;
        setIsSubscribed(true);
        toast({ title: 'Subscribed', description: 'You are now subscribed to this creator' });
      }

      loadSubscriptions(userId);
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast({ title: 'Error', description: 'Failed to update subscription', variant: 'destructive' });
    }
  };

  const checkFollowStatus = async (userId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        toast({ title: 'Unfollowed', description: 'You unfollowed this creator' });
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;
        setIsFollowing(true);
        toast({ title: 'Following', description: 'You are now following this creator' });
      }

      // Reload profile to get updated counts
      loadProfile(userId);
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({ title: 'Error', description: 'Failed to update follow status', variant: 'destructive' });
    }
  };

  const handleMessage = () => {
    if (!user) {
      toast({ title: 'Login required', description: 'Please login to message creators', variant: 'destructive' });
      return;
    }

    // Navigate to inbox or create conversation
    navigate('/inbox');
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: profile?.display_name || 'Creator Profile',
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Copied!', description: 'Profile link copied to clipboard' });
    }
    setShowShareModal(false);
  };

  const handleVideoClick = (videoId: string) => {
    navigate('/feed', { state: { videoId } });
  };

  const handleAvatarClick = () => {
    if (hasActiveStory && stories.length > 0) {
      navigate(`/story/${stories[0].id}`);
    }
  };

  const handleUsernameClick = () => {
    // Navigate to user's profile or copy username
    navigator.clipboard.writeText(`@${profile?.username}`);
    toast({ title: 'Copied!', description: 'Username copied to clipboard' });
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getDisplayVideos = () => {
    switch (activeTab) {
      case 'pinned':
        return pinnedVideos.length > 0 ? pinnedVideos : [];
      case 'likes':
        return videos.filter(v => v.likes_count > 0).slice(0, 20);
      case 'private':
        return videos.filter(v => v.is_private);
      default:
        return videos;
    }
  };

  const renderStudioSection = () => {
    if (!studioData) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles size={40} className="text-gray-400" />
          </div>
          <p className="text-white text-lg mb-2">No studio data yet</p>
          <p className="text-gray-400 text-sm">This creator hasn't activated TikTok Studio</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Views</p>
          <p className="text-white text-xl font-bold">{studioData.total_views.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Likes</p>
          <p className="text-white text-xl font-bold">{studioData.total_likes.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Shares</p>
          <p className="text-white text-xl font-bold">{studioData.total_shares.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Comments</p>
          <p className="text-white text-xl font-bold">{studioData.total_comments.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Followers Gained</p>
          <p className="text-white text-xl font-bold">{studioData.total_followers_gained.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Revenue</p>
          <p className="text-white text-xl font-bold">${studioData.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 col-span-2">
          <p className="text-gray-400 text-xs mb-1">Profile Completion</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${studioData.profile_completion_score}%` }}
              />
            </div>
            <p className="text-white text-xl font-bold">{studioData.profile_completion_score}%</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionSection = () => {
    return (
      <div className="space-y-4">
        {user?.id !== profile?.user_id && (
          <button
            onClick={handleSubscribe}
            className={`w-full px-6 py-4 rounded-xl font-semibold transition-all text-lg ${
              isSubscribed
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
        
        {subscriptions.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">Active Subscribers</h3>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div>
                    <p className="text-white font-semibold capitalize">{sub.tier}</p>
                    <p className="text-gray-400 text-sm">${sub.monthly_price}/month</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                Total Subscribers: <span className="text-white font-bold">{subscriptions.length}</span>
              </p>
            </div>
          </div>
        )}
        
        {subscriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles size={40} className="text-gray-400" />
            </div>
            <p className="text-white text-lg mb-2">No subscriptions yet</p>
            <p className="text-gray-400 text-sm">Be the first to subscribe to this creator</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNotificationsClick}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Bell size={24} />
            </button>
            <button
              onClick={handleSettingsClick}
              className="text-white hover:text-gray-300 transition-colors relative"
            >
              <Settings size={24} />
              {showSettingsMenu && (
                <div className="absolute top-10 right-0 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-2 w-48">
                  <button className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm">
                    Report User
                  </button>
                  <button className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm">
                    Block User
                  </button>
                  <button className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm">
                    Share Profile
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
          {/* Avatar with Story Ring */}
          <div className="relative">
            <div 
              className={`w-20 h-20 md:w-32 md:h-32 rounded-full p-1 cursor-pointer ${
                hasActiveStory 
                  ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500' 
                  : 'border-4 border-white/20'
              }`}
              onClick={handleAvatarClick}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full rounded-full object-cover border-2 border-black"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl md:text-5xl border-2 border-black">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {profile.verified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-black">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 
                className="text-white text-xl md:text-3xl font-bold cursor-pointer hover:underline"
                onClick={handleUsernameClick}
              >
                {profile.display_name}
              </h1>
              {profile.verified && (
                <div className="bg-blue-500 rounded-full p-0.5 md:p-1">
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full" />
                  </div>
                </div>
              )}
              {/* Creator Badges */}
              {profile.creator_badges && profile.creator_badges.length > 0 && (
                <div className="flex gap-1">
                  {profile.creator_badges.map((badge, index) => (
                    <span key={index} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p 
              className="text-gray-300 text-base md:text-lg mb-2 cursor-pointer hover:underline"
              onClick={handleUsernameClick}
            >
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-white text-sm md:text-base mb-3">{profile.bio}</p>
            )}

            {/* Social Links */}
            {(profile.website_url || profile.instagram_url || profile.twitter_url || profile.youtube_url || profile.tiktok_url) && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    <LinkIcon size={14} />
                    Website
                  </a>
                )}
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 text-sm">
                    Instagram
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 text-sm">
                    Twitter
                  </a>
                )}
                {profile.youtube_url && (
                  <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 text-sm">
                    YouTube
                  </a>
                )}
                {profile.tiktok_url && (
                  <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 text-sm">
                    TikTok
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 md:gap-6 mb-4">
              <div className="text-center">
                <p className="text-white text-lg md:text-xl font-bold">{profile.videos_count}</p>
                <p className="text-gray-400 text-xs md:text-sm">Videos</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg md:text-xl font-bold">{profile.followers_count}</p>
                <p className="text-gray-400 text-xs md:text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg md:text-xl font-bold">{profile.following_count}</p>
                <p className="text-gray-400 text-xs md:text-sm">Following</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg md:text-xl font-bold">{profile.likes_count}</p>
                <p className="text-gray-400 text-xs md:text-sm">Likes</p>
              </div>
              {profile.profile_views_count !== undefined && (
                <div className="text-center">
                  <p className="text-white text-lg md:text-xl font-bold">{profile.profile_views_count}</p>
                  <p className="text-gray-400 text-xs md:text-sm">Views</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3">
              {user?.id !== profile.user_id ? (
                <>
                  <button
                    onClick={handleFollow}
                    className={`flex-1 px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all text-sm md:text-base ${
                      isFollowing
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="px-4 md:px-6 py-2 md:py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all"
                  >
                    <MessageSquare size={20} className="md:hidden" />
                    <MessageSquare size={20} className="hidden md:block" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm md:text-base"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleShare}
                className="px-4 md:px-6 py-2 md:py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Story Highlights */}
      {storyHighlights.length > 0 && (
        <div className="px-4 md:px-6 mb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {storyHighlights.map((highlight) => (
              <div key={highlight.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                </div>
                <span className="text-white text-xs text-center">{highlight.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 md:px-6 mb-4">
        <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'videos' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Videos
          </button>
          {pinnedVideos.length > 0 && (
            <button
              onClick={() => setActiveTab('pinned')}
              className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'pinned' 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Pin size={14} />
              Pinned
            </button>
          )}
          <button
            onClick={() => setActiveTab('likes')}
            className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'likes' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart size={14} />
            Liked
          </button>
          {user?.id === profile.user_id && (
            <button
              onClick={() => setActiveTab('private')}
              className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'private' 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LockIcon size={14} />
              Private
            </button>
          )}
          {user?.id === profile.user_id && (
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'studio' 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              Studio
            </button>
          )}
          {subscriptions.length > 0 && (
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'subscriptions' 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              Subscriptions
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 md:p-6">
        {activeTab === 'studio' ? (
          renderStudioSection()
        ) : activeTab === 'subscriptions' ? (
          renderSubscriptionSection()
        ) : getDisplayVideos().length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {getDisplayVideos().map((video) => (
              <div
                key={video.id}
                className="relative aspect-[9/16] cursor-pointer group"
                onClick={() => handleVideoClick(video.id)}
              >
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.caption || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
                    </div>
                  </div>
                )}

                {/* Video Duration */}
                {video.duration && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* View Count */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs">
                  <Eye size={12} />
                  <span>{formatViewCount(video.views)}</span>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <Heart size={16} />
                      <span className="text-sm">{video.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={16} />
                      <span className="text-sm">{video.comments_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Premium Badge */}
                {video.is_premium && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    Premium
                  </div>
                )}

                {/* Private Badge */}
                {video.is_private && (
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <LockIcon size={10} />
                    Private
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'pinned' ? (
                <Pin size={40} className="text-gray-400" />
              ) : activeTab === 'likes' ? (
                <Heart size={40} className="text-gray-400" />
              ) : activeTab === 'private' ? (
                <LockIcon size={40} className="text-gray-400" />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            <p className="text-white text-lg mb-2">No videos yet</p>
            <p className="text-gray-400 text-sm">
              {activeTab === 'pinned' 
                ? 'This creator hasn\'t pinned any videos' 
                : activeTab === 'likes' 
                ? 'No liked videos yet' 
                : activeTab === 'private' 
                ? 'No private videos yet' 
                : 'This creator hasn\'t posted any videos'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorProfile;
