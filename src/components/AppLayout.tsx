import React from 'react';
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

const AppLayout: React.FC = () => {
  const { isAuthenticated, activeTab, isLoading } = useAppContext();

  // Show a global loading spinner while the app context is initializing
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-200 mb-6 drop-shadow-lg">
            Optimize Your Digital Earnings
          </h1>
          <p className="text-xl text-indigo-100/80 mb-10 max-w-2xl">
            Unlock premium opportunities, track your progress, and maximize your digital footprint in the new economy.
          </p>
          <button className="px-10 py-4 rounded-full font-bold text-lg backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(14,165,233,0.3)] bg-white/5 hover:shadow-[0_0_40px_rgba(192,132,252,0.6)] hover:scale-[1.02] transition-all duration-500">
            Get Started
          </button>
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
    </div>
  );
};

export default AppLayout;
