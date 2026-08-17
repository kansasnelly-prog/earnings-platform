import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Navbar from './Navbar';
import LoadingSpinner from './ui/LoadingSpinner';
import AuthModal from './AuthModal';
import Dashboard from './Dashboard';
import TaskGrid from './TaskGrid';
import WalletSection from './WalletSection';
import WithdrawalSection from './WithdrawalSection';
import ProfileSection from './ProfileSection';
import NotificationCenter from './social/NotificationCenter';
import AdminPanel from './AdminPanel';
import About from '@/pages/About';
import Legal from '@/pages/Legal';
import TelegramWidget from './TelegramWidget';
import Footer from './Footer';
import { Mail, Radio, Users, Chrome } from 'lucide-react';

const QuickAuthDock: React.FC<{
  onOpenAuth: (tab: 'login' | 'register') => void;
  userName?: string;
}> = ({ onOpenAuth, userName }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEAuth = () => {
    onOpenAuth('register');
  };

  const handleGAuth = async () => {
    try {
      const GoogleOAuthService = (await import('@/services/googleOAuthService')).default;
      const result = await GoogleOAuthService.initiateOAuth();
      if (!result.success) {
        console.error('[QuickAuthDock] Google OAuth failed:', result.error);
      }
    } catch (error) {
      console.error('[QuickAuthDock] Google OAuth error:', error);
    }
  };

  const handleTikTokAuth = () => {
    window.open('https://www.tiktok.com/oembed', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          flex items-center gap-2 transition-all duration-500 ease-out
          ${isHovered ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-90'}
        `}
      >
        {/* Session quick-resume badge */}
        {userName && (
          <div className="hidden md:flex items-center gap-2 bg-black/70 backdrop-blur-md border border-cyan-500/30 px-3 py-2 rounded-none shadow-[0_0_20px_rgba(0,255,255,0.15)]">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-cyan-300 font-black tracking-widest uppercase">
              Continue as {userName}
            </span>
          </div>
        )}

        {/* E - Earnings/Nelly TV */}
        <button
          onClick={handleEAuth}
          className="group relative w-12 h-12 bg-black/70 backdrop-blur-md border border-purple-500/30 hover:border-cyan-400/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300 flex items-center justify-center"
        >
          <Mail className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
          <span className="absolute -top-1 -right-1 text-[8px] font-black text-purple-400 bg-black/80 px-1 border border-purple-500/30">
            E
          </span>
        </button>

        {/* G - Google OAuth */}
        <button
          onClick={handleGAuth}
          className="group relative w-12 h-12 bg-black/70 backdrop-blur-md border border-purple-500/30 hover:border-cyan-400/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300 flex items-center justify-center"
        >
          <Chrome className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
          <span className="absolute -top-1 -right-1 text-[8px] font-black text-purple-400 bg-black/80 px-1 border border-purple-500/30">
            G
          </span>
        </button>

        {/* TikTok */}
        <button
          onClick={handleTikTokAuth}
          className="group relative w-12 h-12 bg-black/70 backdrop-blur-md border border-purple-500/30 hover:border-cyan-400/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300 flex items-center justify-center"
        >
          <Radio className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
          <span className="absolute -top-1 -right-1 text-[8px] font-black text-purple-400 bg-black/80 px-1 border border-purple-500/30">
            T
          </span>
        </button>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { isAuthenticated, activeTab, isLoading, setAuthModalOpen, setAuthModalTab, user } = useAppContext();
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [returningUserName, setReturningUserName] = useState<string | undefined>(undefined);

  // Show a global loading spinner while the app context is initializing
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Session auto-detection for returning users
  useEffect(() => {
    const detectReturningUser = async () => {
      if (typeof window === 'undefined') return;
      try {
        const cached = localStorage.getItem('opt_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.email) {
            setReturningUserName(parsed.display_name || parsed.email.split('@')[0]);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };
    detectReturningUser();
  }, []);

  const handleOpenAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-200 mb-6 drop-shadow-lg">
              Optimize Your Digital Earnings
            </h1>
            <p className="text-xl text-indigo-100/80 mb-10 max-w-2xl mx-auto">
              Unlock premium opportunities, track your progress, and maximize your digital footprint in the new economy.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => handleOpenAuth('register')}
                className="px-10 py-4 rounded-full font-bold text-lg backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(14,165,233,0.3)] bg-white/5 hover:shadow-[0_0_40px_rgba(192,132,252,0.6)] hover:scale-[1.02] transition-all duration-500"
              >
                Get Started
              </button>
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-10 py-4 rounded-full font-bold text-lg backdrop-blur-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-400/60 transition-all duration-500"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }
    switch (activeTab) {
      case 'tasks':
        return <TaskGrid />;
      case 'wallet':
        return <WalletSection />;
      case 'withdraw':
        return <WithdrawalSection />;
      case 'profile':
        return <ProfileSection />;
      case 'notifications':
        return <NotificationCenter />;
      case 'about':
        return <About />;
      case 'legal':
        return <Legal />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white text-left relative overflow-hidden">
      {/* Heavenly Background Mesh */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.15),_transparent_70%),_radial-gradient(circle_at_100%_0%,_rgba(192,38,211,0.15),_transparent_70%),_radial-gradient(circle_at_0%_100%,_rgba(14,165,233,0.15),_transparent_70%)]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <AuthModal />
        <TelegramWidget />

        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {renderContent()}
        </main>

        <Footer />
      </div>

      {/* Quick-Auth Dock - visible on landing when not authenticated */}
      {!isAuthenticated && (
        <QuickAuthDock onOpenAuth={handleOpenAuth} userName={returningUserName} />
      )}
    </div>
  );
};

export default AppLayout;
