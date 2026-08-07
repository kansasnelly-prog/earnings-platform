import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, UserMinus, MessageSquare, Video, ArrowLeft, Users, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import StoriesRow from './StoriesRow';

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  verified: boolean;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: UserProfile;
}

interface FriendActivity {
  id: string;
  user_id: string;
  activity_type: string;
  target_type?: string;
  target_id?: string;
  target_user_id?: string;
  metadata?: any;
  created_at: string;
  user_profile?: UserProfile;
  target_profile?: UserProfile;
}

interface LiveStream {
  id: string;
  user_id: string;
  stream_url: string;
  thumbnail_url?: string;
  title?: string;
  viewer_count: number;
  is_live: boolean;
  started_at: string;
  user_profile?: UserProfile;
}

type TabType = 'requests' | 'suggestions' | 'following' | 'followers' | 'activity';

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  
  // Loading states
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllData();
      setupRealtimeSubscriptions();
    }
    return () => {
      // Cleanup subscriptions
    };
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    Promise.all([
      loadFriendRequests(),
      loadFriendSuggestions(),
      loadFollowing(),
      loadFollowers(),
      loadFriendActivities(),
      loadLiveStreams()
    ]);
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to friend requests changes
    const requestsSubscription = supabase
      .channel('friend_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          loadFriendRequests();
        }
      )
      .subscribe();

    // Subscribe to followers changes
    const followersSubscription = supabase
      .channel('followers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `follower_id=eq.${user.id}`
        },
        () => {
          loadFollowing();
          loadFollowers();
        }
      )
      .subscribe();

    // Subscribe to live streams changes
    const liveSubscription = supabase
      .channel('live_streams_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        },
        () => {
          loadLiveStreams();
        }
      )
      .subscribe();
  };

  const loadFriendRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender_profile:user_profiles!friend_requests_sender_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            followers_count,
            following_count,
            verified
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadFriendSuggestions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_friend_suggestions', { 
          p_user_id: user.id, 
          p_limit: 20 
        });

      if (error) throw error;
      setFriendSuggestions(data || []);
    } catch (error) {
      console.error('Error loading friend suggestions:', error);
      // Fallback: load users not followed
      loadFallbackSuggestions();
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadFallbackSuggestions = async () => {
    if (!user) return;
    
    try {
      const { data: followedIds } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      const followedSet = new Set(followedIds?.map(f => f.following_id) || []);
      followedSet.add(user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .not('user_id', 'in', `(${Array.from(followedSet).join(',')})`)
        .limit(20);

      if (error) throw error;
      setFriendSuggestions(data || []);
    } catch (error) {
      console.error('Error loading fallback suggestions:', error);
    }
  };

  const loadFollowing = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles:user_profiles!followers_following_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            followers_count,
            following_count,
            verified
          )
        `)
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowing((data?.map(f => f.profiles).filter(Boolean) || []).flat());
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const loadFollowers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles:user_profiles!followers_follower_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            followers_count,
            following_count,
            verified
          )
        `)
        .eq('following_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowers((data?.map(f => f.profiles).filter(Boolean) || []).flat());
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const loadFriendActivities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('friend_activities')
        .select(`
          *,
          user_profile:user_profiles!friend_activities_user_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            verified
          ),
          target_profile:user_profiles!friend_activities_target_user_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url
          )
        `)
        .or(`user_id.eq.${user.id},target_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading friend activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadLiveStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          user_profile:user_profiles!live_streams_user_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            verified
          )
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLiveStreams(data || []);
    } catch (error) {
      console.error('Error loading live streams:', error);
    } finally {
      setLoadingLive(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!user) return;

    try {
      // Update friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create follow relationship (both ways)
      await supabase.from('followers').insert([
        { follower_id: user.id, following_id: senderId },
        { follower_id: senderId, following_id: user.id }
      ]);

      // Create activity
      await supabase.rpc('create_friend_activity', {
        p_user_id: user.id,
        p_activity_type: 'follow',
        p_target_user_id: senderId
      });

      toast({ title: 'Friend request accepted' });
      loadFriendRequests();
      loadFollowing();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;
      toast({ title: 'Friend request declined' });
      loadFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast({ title: 'Error', description: 'Failed to decline request', variant: 'destructive' });
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });

      if (error) throw error;
      toast({ title: 'Friend request sent' });
      loadFriendSuggestions();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;

      // Create activity
      await supabase.rpc('create_friend_activity', {
        p_user_id: user.id,
        p_activity_type: 'follow',
        p_target_user_id: targetUserId
      });

      toast({ title: 'Following' });
      loadFollowing();
      loadFriendSuggestions();
    } catch (error) {
      console.error('Error following user:', error);
      toast({ title: 'Error', description: 'Failed to follow', variant: 'destructive' });
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
      toast({ title: 'Unfollowed' });
      loadFollowing();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({ title: 'Error', description: 'Failed to unfollow', variant: 'destructive' });
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchQuery(query);
      return;
    }

    setSearchQuery(query);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      
      // Update suggestions with search results
      setFriendSuggestions(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const filteredSuggestions = searchQuery 
    ? friendSuggestions 
    : friendSuggestions.slice(0, 10);

  const renderUserCard = (profile: UserProfile, isFollowing: boolean = false) => (
    <div key={profile.user_id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
      <button
        onClick={() => handleProfileClick(profile.user_id)}
        className="flex-shrink-0"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <button
          onClick={() => handleProfileClick(profile.user_id)}
          className="text-left"
        >
          <p className="text-white font-semibold truncate flex items-center gap-1">
            {profile.display_name}
            {profile.verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </p>
          <p className="text-gray-400 text-sm">@{profile.username}</p>
        </button>
      </div>

      <div className="flex gap-2">
        {isFollowing ? (
          <button
            onClick={() => handleUnfollow(profile.user_id)}
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Following
          </button>
        ) : (
          <>
            <button
              onClick={() => handleFollow(profile.user_id)}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-colors"
            >
              Follow
            </button>
            <button
              onClick={() => handleSendRequest(profile.user_id)}
              className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <UserPlus size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderActivityItem = (activity: FriendActivity) => {
    const getActivityText = () => {
      switch (activity.activity_type) {
        case 'follow':
          return `started following ${activity.target_profile?.display_name || 'someone'}`;
        case 'like':
          return `liked a post`;
        case 'comment':
          return `commented on a post`;
        case 'share':
          return `shared a post`;
        case 'live_start':
          return `started a live stream`;
        case 'post':
          return `posted a new video`;
        case 'story':
          return `added a new story`;
        default:
          return 'did something';
      }
    };

    return (
      <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
        <button
          onClick={() => activity.user_profile && handleProfileClick(activity.user_profile.user_id)}
          className="flex-shrink-0"
        >
          {activity.user_profile?.avatar_url ? (
            <img
              src={activity.user_profile.avatar_url}
              alt={activity.user_profile.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {activity.user_profile?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm">
            <span className="font-semibold">{activity.user_profile?.display_name}</span>
            <span className="text-gray-400"> {getActivityText()}</span>
          </p>
          <p className="text-gray-500 text-xs">{new Date(activity.created_at).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderLiveCard = (stream: LiveStream) => (
    <div key={stream.id} className="relative bg-white/5 rounded-xl overflow-hidden">
      <div className="aspect-[9/16] relative">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.title || 'Live stream'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <Video size={48} className="text-white" />
          </div>
        )}
        
        {/* LIVE Badge */}
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
        
        {/* Viewer Count */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {stream.viewer_count} viewers
        </div>

        {/* Stream Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <button
            onClick={() => stream.user_profile && handleProfileClick(stream.user_profile.user_id)}
            className="flex items-center gap-2"
          >
            {stream.user_profile?.avatar_url ? (
              <img
                src={stream.user_profile.avatar_url}
                alt={stream.user_profile.display_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {stream.user_profile?.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="text-left">
              <p className="text-white text-sm font-semibold">{stream.user_profile?.display_name}</p>
              <p className="text-gray-300 text-xs">{stream.title || 'Live now'}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-white text-xl font-bold">Friends</h1>
          </div>
          <button className="text-white hover:text-gray-300 transition-colors">
            <Search size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-shrink-0 px-4 py-3 text-center font-semibold transition-all ${
              activeTab === 'requests'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Requests
            {friendRequests.length > 0 && (
              <span className="ml-1 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-shrink-0 px-4 py-3 text-center font-semibold transition-all ${
              activeTab === 'suggestions'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-shrink-0 px-4 py-3 text-center font-semibold transition-all ${
              activeTab === 'following'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-shrink-0 px-4 py-3 text-center font-semibold transition-all ${
              activeTab === 'followers'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-shrink-0 px-4 py-3 text-center font-semibold transition-all ${
              activeTab === 'activity'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Stories Row */}
      <StoriesRow />

      {/* Live Streams Section (always visible) */}
      {liveStreams.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Video className="text-red-500" size={20} />
            <h2 className="text-white font-bold">Live Now</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {liveStreams.map(renderLiveCard)}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 pb-24">
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {loadingRequests ? (
              <div className="text-white text-center py-8">Loading requests...</div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-white">No pending friend requests</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <button
                    onClick={() => request.sender_profile && handleProfileClick(request.sender_profile.user_id)}
                    className="flex-shrink-0"
                  >
                    {request.sender_profile?.avatar_url ? (
                      <img
                        src={request.sender_profile.avatar_url}
                        alt={request.sender_profile.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {request.sender_profile?.display_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => request.sender_profile && handleProfileClick(request.sender_profile.user_id)}
                      className="text-left"
                    >
                      <p className="text-white font-semibold truncate">{request.sender_profile?.display_name}</p>
                      <p className="text-gray-400 text-sm">@{request.sender_profile?.username}</p>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id, request.sender_id)}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {loadingSuggestions ? (
              <div className="text-white text-center py-8">Loading suggestions...</div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-white">No suggestions available</p>
              </div>
            ) : (
              filteredSuggestions.map((profile) => renderUserCard(profile))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-3">
            {loadingFollowing ? (
              <div className="text-white text-center py-8">Loading following...</div>
            ) : following.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-white">You're not following anyone yet</p>
              </div>
            ) : (
              following.map((profile) => renderUserCard(profile, true))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="space-y-3">
            {loadingFollowers ? (
              <div className="text-white text-center py-8">Loading followers...</div>
            ) : followers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-white">No followers yet</p>
              </div>
            ) : (
              followers.map((profile) => renderUserCard(profile, false))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            {loadingActivities ? (
              <div className="text-white text-center py-8">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-white">No recent activity</p>
              </div>
            ) : (
              activities.map(renderActivityItem)
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 px-2 py-3 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-semibold">Friends</span>
          </button>

          <button
            onClick={() => navigate('/create')}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/inbox')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs">Inbox</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
