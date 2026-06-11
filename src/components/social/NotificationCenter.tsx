import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const NotificationCenter: React.FC = () => {
  const { user } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications(data || []);
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-[300px]">
      <h2 className="text-xl mb-4">Notifications</h2>
      {notifications.map(n => (
        <div key={n.id} className={`p-3 mb-2 rounded ${n.is_read ? 'bg-gray-800' : 'bg-indigo-900'}`} onClick={() => markAsRead(n.id)}>
          <p>{n.message}</p>
          <small className="text-gray-400">{new Date(n.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;
