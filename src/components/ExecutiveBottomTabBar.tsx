import React, { useState, useEffect } from 'react';

interface ExecutiveBottomTabBarProps {
  currentTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const ExecutiveBottomTabBar: React.FC<ExecutiveBottomTabBarProps> = ({ currentTab = 'suite', onTabChange }) => {
  const [activeTab, setActiveTab] = useState<string>(currentTab);

  useEffect(() => {
    // Force full-screen Telegram Mini App viewport expansion
    try {
      if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.ready();
        (window as any).Telegram.WebApp.expand();
      }
    } catch (e) {
      console.warn('Telegram WebApp expansion exception:', e);
    }
  }, []);

  const navigateToTab = (tabId: string, path: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
    window.location.hash = path; // Native hash navigation without losing existing state
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'rgba(5, 5, 8, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(212, 175, 55, 0.4)',
      zIndex: 99999,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      alignItems: 'center',
      overflowX: 'auto',
      scrollbarWidth: 'none', // Hide scrollbar for Firefox
      msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
    }}>
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
      
      <div style={{
        display: 'flex',
        minWidth: '100%',
        justifyContent: 'space-around',
        padding: '0 10px'
      }}>
        {/* Tab 1: Executive Hub */}
        <button 
          onClick={() => navigateToTab('dashboard', '#/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'dashboard' ? '#D4AF37' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            minWidth: '70px',
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '20px', transform: activeTab === 'dashboard' ? 'scale(1.2)' : 'scale(1)' }}>👑</span>
          <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px', color: activeTab === 'dashboard' ? '#D4AF37' : '#666' }}>HUB</span>
        </button>

        {/* Tab 2: Sreymara Luxury Suite */}
        <button 
          onClick={() => navigateToTab('suite', '#/tg')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'suite' ? '#FF007F' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            minWidth: '70px'
          }}
        >
          <span style={{ fontSize: '20px', transform: activeTab === 'suite' ? 'scale(1.2)' : 'scale(1)' }}>💬</span>
          <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px', color: activeTab === 'suite' ? '#FF007F' : '#666' }}>SUITE</span>
        </button>

        {/* Tab 3: Monetization & Ad Engine */}
        <button 
          onClick={() => navigateToTab('ads', '#/tg?view=monetization')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'ads' ? '#00FFFF' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            minWidth: '70px'
          }}
        >
          <span style={{ fontSize: '20px', transform: activeTab === 'ads' ? 'scale(1.2)' : 'scale(1)' }}>💰</span>
          <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px', color: activeTab === 'ads' ? '#00FFFF' : '#666' }}>YIELD</span>
        </button>

        {/* Tab 4: Wallet & Payout */}
        <button 
          onClick={() => navigateToTab('wallet', '#/wallet')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'wallet' ? '#10B981' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            minWidth: '70px'
          }}
        >
          <span style={{ fontSize: '20px', transform: activeTab === 'wallet' ? 'scale(1.2)' : 'scale(1)' }}>💳</span>
          <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px', color: activeTab === 'wallet' ? '#10B981' : '#666' }}>PAYOUT</span>
        </button>

        {/* Tab 5: Command Center */}
        <button 
          onClick={() => navigateToTab('admin', '#/admin/command-center')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'admin' ? '#00FF00' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            minWidth: '70px'
          }}
        >
          <span style={{ fontSize: '20px', transform: activeTab === 'admin' ? 'scale(1.2)' : 'scale(1)' }}>⚡</span>
          <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px', color: activeTab === 'admin' ? '#00FF00' : '#666' }}>COMMAND</span>
        </button>
      </div>
    </div>
  );
};
