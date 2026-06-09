import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, AtSign, UserPlus } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'like' | 'comment' | 'share' | 'mention';
  actor_id: string;
  actor_username: string;
  actor_avatar: string;
  target_type: string;
  target_id: string;
  target_url: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsSection: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    setupRealtimeSubscription();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
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
        .channel('notifications-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new as Notification, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev =>
                prev.map(notif =>
                  notif.id === payload.new.id ? payload.new as Notification : notif
                )
              );
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

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      // Navigate to target
      if (notification.target_url) {
        navigate(notification.target_url);
      } else {
        // Default navigation based on type
        switch (notification.type) {
          case 'follow':
            navigate(`/profile/${notification.actor_id}`);
            break;
          case 'like':
          case 'comment':
          case 'share':
            if (notification.target_id) {
              navigate(`/video/${notification.target_id}`);
            }
            break;
          case 'mention':
            navigate(`/video/${notification.target_id}`);
            break;
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={20} className="text-blue-500" />;
      case 'like':
        return <Heart size={20} className="text-red-500" />;
      case 'comment':
        return <MessageCircle size={20} className="text-green-500" />;
      case 'share':
        return <Share2 size={20} className="text-purple-500" />;
      case 'mention':
        return <AtSign size={20} className="text-yellow-500" />;
      default:
        return <Heart size={20} className="text-gray-500" />;
    }
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

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-white font-bold mb-4">Notifications</h2>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-2 animate-pulse">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <button
          onClick={async () => {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (!user) return;
            await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('user_id', user.id);
            loadNotifications();
          }}
          className="text-gray-400 text-sm hover:text-white"
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                !notification.is_read ? 'bg-gray-800/80' : 'bg-transparent hover:bg-gray-800/50'
              }`}
            >
              <div className="relative">
                {notification.actor_avatar ? (
                  <img
                    src={notification.actor_avatar}
                    alt={notification.actor_username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {notification.actor_username?.charAt(0) || '?'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>

              <div className="flex-1 text-left">
                <p className="text-white text-sm">
                  <span className="font-semibold">{notification.actor_username}</span>
                  {' '}
                  {notification.message}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {formatTime(notification.created_at)}
                </p>
              </div>

              {!notification.is_read && (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;
