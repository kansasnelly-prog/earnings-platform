import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CSNotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CSNotificationContext = createContext<CSNotificationContextType | undefined>(undefined);

export const useCSNotification = () => {
  const context = useContext(CSNotificationContext);
  if (!context) {
    throw new Error('useCSNotification must be used within a CSNotificationProvider');
  }
  return context;
};

export const CSNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: string }[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <CSNotificationContext.Provider value={{ showNotification }}>
      {children}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: n.type === 'error' ? '#ef4444' : n.type === 'success' ? '#10b981' : '#3b82f6',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              marginBottom: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease'
            }}
          >
            {n.message}
          </div>
        ))}
      </div>
    </CSNotificationContext.Provider>
  );
};
