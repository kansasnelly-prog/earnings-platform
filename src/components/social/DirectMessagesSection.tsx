import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_id: string;
  last_message_at: string;
  user1_unread_count: number;
  user2_unread_count: number;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  last_message?: {
    message: string;
    created_at: string;
  };
}

const DirectMessagesSection: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Get conversations where current user is either user1 or user2
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          *,
          user1:users!direct_conversations_user1_id_fkey (
            id,
            display_name,
            avatar_url
          ),
          user2:users!direct_conversations_user2_id_fkey (
            id,
            display_name,
            avatar_url
          ),
          last_message:direct_messages!direct_conversations_last_message_id_fkey (
            message,
            created_at
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform data to include other user info
      const transformedConversations = (data || []).map((conv: any) => {
        const isUser1 = conv.user1_id === user.id;
        const otherUser = isUser1 ? conv.user2 : conv.user1;
        const unreadCount = isUser1 ? conv.user1_unread_count : conv.user2_unread_count;

        return {
          ...conv,
          other_user: otherUser,
          unread_count: unreadCount
        };
      });

      setConversations(transformedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    let subscription: any;

    const initSubscription = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      subscription = supabase
        .channel('conversations-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'direct_conversations',
            filter: `or=(user1_id.eq.${user.id},user2_id.eq.${user.id})`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              loadConversations();
            }
          }
        )
        .subscribe();
    };

    initSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  };

  const handleConversationClick = async (conversation: Conversation) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Reset unread count
      await supabase.rpc('reset_direct_conversation_unread', {
        p_user_id: user.id,
        p_conversation_id: conversation.id
      });

      // Navigate to conversation
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error handling conversation click:', error);
    }
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv as any).unread_count, 0);
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-white font-bold mb-4">Messages</h2>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-2 animate-pulse">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalUnread = getTotalUnreadCount();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">
          Messages
          {totalUnread > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {totalUnread}
            </span>
          )}
        </h2>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No messages yet</p>
          <button
            onClick={() => navigate('/messages/new')}
            className="mt-4 text-purple-400 hover:text-purple-300"
          >
            Start a conversation
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                (conversation as any).unread_count > 0 ? 'bg-gray-800/80' : 'bg-transparent hover:bg-gray-800/50'
              }`}
            >
              {/* Profile Image */}
              <div
                onClick={(e) => conversation.other_user && handleProfileClick(e, conversation.other_user.id)}
                className="flex-shrink-0"
              >
                {conversation.other_user?.avatar_url ? (
                  <img
                    src={conversation.other_user.avatar_url}
                    alt={conversation.other_user.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {conversation.other_user?.display_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Username and Last Message */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white font-semibold text-sm truncate">
                    {conversation.other_user?.display_name || 'Unknown'}
                  </p>
                  <p className="text-gray-400 text-xs ml-2 flex-shrink-0">
                    {conversation.last_message_at && formatTime(conversation.last_message_at)}
                  </p>
                </div>
                <p className="text-gray-400 text-sm truncate">
                  {conversation.last_message?.message || 'No messages yet'}
                </p>
              </div>

              {/* Unread Badge */}
              {(conversation as any).unread_count > 0 && (
                <div className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {(conversation as any).unread_count}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectMessagesSection;
