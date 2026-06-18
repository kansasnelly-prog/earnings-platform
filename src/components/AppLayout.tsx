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
      return null;
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
    <div className="min-h-screen bg-[#060a14] text-white text-left">
      <Navbar />
      <AuthModal />
      <TelegramWidget />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
