import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useCSNotification } from '@/contexts/CSNotificationContext';
import { LogOut, User, ChevronDown, Zap, LayoutDashboard, Wallet, ArrowDownToLine, UserCircle, Menu, X, Shield, MessageCircle, ExternalLink, RefreshCw, Badge } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const { unreadCount } = useCSNotification();
  const {
    isAuthenticated,
    user,
    setAuthModalOpen,
    setAuthModalTab,
    logout,
    activeTab,
    setActiveTab,
    refreshUser,
    refreshApp,
    walletState
  } = context;
  
  // Safety wrapper for setActiveTab
  const safeSetActiveTab = (tab: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else {
      console.error('setActiveTab is not a function', context);
    }
  };
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

const displayRole =
  user?.account_type === 'admin'
    ? 'Admin'
    : user?.vip_level
      ? `VIP${user.vip_level} Member`
      : 'Member';

const openLogin = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };
  const openRegister = () => {
    setAuthModalTab('register');
    setAuthModalOpen(true);
  };
  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  }, {
    id: 'tasks',
    label: 'Tasks',
    icon: Zap
  }, {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet
  }, {
    id: 'withdraw',
    label: 'Withdraw',
    icon: ArrowDownToLine
  }, {
    id: 'profile',
    label: 'Profile',
    icon: UserCircle
  }, {
    id: 'about',
    label: 'About',
    icon: Shield
  }, {
    id: 'legal',
    label: 'Legal',
    icon: MessageCircle,
    hasBadge: true
  }];

  const allNavItems = user?.account_type === 'admin' ? [
    ...navItems,
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield
    }
  ] : navItems;
  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-indigo-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
          if (isAuthenticated) safeSetActiveTab('dashboard');
        }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-green-500 text-base">EARNINGSLLC
          </span>
          </div>

          {/* Desktop Nav Links (only when authenticated) */}
          {isAuthenticated && <div className="hidden md:flex items-center gap-1">
              {allNavItems.map(item => <button key={item.id} onClick={() => {
                safeSetActiveTab(item.id);
              }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <item.icon size={16} className="inline mr-2" />
                  {item.label}
                </button>)}
            </div>}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Balance Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-emerald-400 text-xs font-medium">Balance:</span>
                  <span className="text-emerald-300 text-sm font-bold">
                    ${(walletState?.available_balance ?? 0).toFixed(2)}
                  </span>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <User size={14} className="text-white" />
                    </div>
                    <span className="hidden sm:block text-sm text-gray-300 max-w-[100px] truncate">{user?.display_name}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {userMenuOpen && <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-[#141829] border border-indigo-500/20 rounded-xl shadow-2xl z-20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-indigo-500/10">
                          <p className="text-sm font-medium text-white">{user?.display_name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full" data-mixed-content="true">VIP{user?.vip_level}</span>
                            <span className="text-xs text-gray-500">{displayRole}</span>
                          </div>
                        </div>
                        <div className="py-1">
                          {allNavItems.map(item => <button key={item.id} onClick={() => {
                      safeSetActiveTab(item.id);
                      setUserMenuOpen(false);
                    }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors relative">
                              <item.icon size={16} className={`text-gray-500 ${item.hasBadge && unreadCount > 0 ? 'animate-pulse text-pink-400' : ''}`} />
                              {item.label}
                              {item.hasBadge && unreadCount > 0 && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                  <span className="text-white text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                                </div>
                              )}
                            </button>)}
                        </div>
                        <div className="border-t border-indigo-500/10 py-1">
                          <button
                            onClick={() => {
                              window.location.reload();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-400 hover:bg-white/5 transition-colors"
                          >
                            <RefreshCw size={16} />
                            Refresh Account
                          </button>
                          <button onClick={async () => {
                      try {
                        // Add timeout protection to logout
                        const logoutPromise = logout();
                        const timeoutPromise = new Promise<never>((_, reject) =>
                          setTimeout(() => reject(new Error('Logout timeout')), 5000)
                        );
                        await Promise.race([logoutPromise, timeoutPromise]);
                      } catch (err) {
                        console.error('[Navbar] Logout error or timeout:', err);
                        // Force logout even if it fails
                        setUserMenuOpen(false);
                        window.location.href = '/';
                      }
                      setUserMenuOpen(false);
                    }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors">
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>}
                </div>

                {/* Mobile Menu Toggle */}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={openLogin} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Sign In
                </button>
                <button onClick={openRegister} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/25">
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Mobile Nav */}
        {isAuthenticated && mobileMenuOpen && <div className="md:hidden border-t border-indigo-500/10 py-2 pb-4">
            <div className="flex items-center gap-1.5 px-2 py-2 mb-2">
              <span className="text-emerald-400 text-xs font-medium">Balance:</span>
              <span className="text-emerald-300 text-sm font-bold" data-mixed-content="true">${(walletState?.available_balance ?? 0).toFixed(2)}</span>
            </div>
            {allNavItems.map(item => <button key={item.id} onClick={() => {
          safeSetActiveTab(item.id);
          setMobileMenuOpen(false);
        }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
                <item.icon size={16} />
                {item.label}
              </button>)}
          </div>}
      </div>
    </nav>
    </>
  );
};
export default Navbar;