import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { CSNotificationProvider } from './contexts/CSNotificationContext';
import { AuthProvider } from './contexts/SafeAuthProvider';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute, { MasterAdminRoute } from './components/ProtectedRoute';
import PlatformSwitch from './components/PlatformSwitch';
import Index from './pages/Index';
import TikTokGate from './pages/TikTokGate';
import AdminCommandDeck from './components/admin/AdminCommandDeck';
import AIAssistantWorkspace from './pages/AIAssistantWorkspace';
import DigitalHome from './pages/admin/index';
import EnhancedAdminDashboard from './components/admin/EnhancedAdminDashboard';
import AdminMatchDigitalHome from './pages/admin-match/index';
import TikTok6SoulmateHub from './pages/TikTok6SoulmateHub';
import TikTok6DatingCockpit from './pages/TikTok6DatingCockpit';
import MatchDashboard from './components/matchmaking/MatchDashboard';
import MatchingFeed from './components/social/MatchingFeed';
import AudioMatchRoom from './components/social/AudioMatchRoom';
import PremiumChatView from './components/social/PremiumChatView';
import Inbox from './components/social/Inbox';
import MessageConversation from './components/social/MessageConversation';
import StoryViewer from './components/social/StoryViewer';
import ExplorePage from './components/social/ExplorePage';
import CreatorProfile from './components/social/CreatorProfile';
import FriendsPage from './components/social/FriendsPage';
import NotFound from './pages/NotFound';
import UserProfilePage from './pages/TikTok6MeProfile';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/SafeAuthProvider';
import TelegramMiniView from './components/telegram/TelegramMiniView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const usePWAInstall = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt || !user) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      await awardDownloadBonus(user.id);
    }

    setDeferredPrompt(null);
  };

  return { deferredPrompt, handleInstall };
};

const awardDownloadBonus = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('download_bonus_awarded, balance')
      .eq('id', userId)
      .single();

    if (profile && !profile.download_bonus_awarded) {
      const userAgent = navigator.userAgent;
      let deviceType = 'web';
      if (/Android/i.test(userAgent)) {
        deviceType = 'android';
      } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        deviceType = 'ios';
      } else if (/Electron/i.test(userAgent)) {
        deviceType = 'desktop';
      }

      await supabase
        .from('profiles')
        .update({
          install_device_type: deviceType,
          download_bonus_awarded: true,
          balance: (profile.balance || 0) + 10,
        })
        .eq('id', userId);

      console.log('[PWA] Download bonus awarded: +10 NellyCoins');
    }
  } catch (error) {
    console.error('[PWA] Error awarding download bonus:', error);
  }
};

const useCaseInsensitiveRouter = () => {
  useEffect(() => {
    const pathname = window.location.pathname;
    const lowercasePath = pathname.toLowerCase();

    if (pathname !== lowercasePath) {
      console.log('[Router Firewall] Forcing lowercase URL:', pathname, '->', lowercasePath);
      window.history.replaceState({}, '', lowercasePath);
    }
  }, []);
};

const useURLParameterCleaner = () => {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

      if (searchParams.has('reloaded') && searchParams.get('reloaded') === 'true') {
        console.log('[URL Cleaner] Removing reloaded=true parameter from URL');
        searchParams.delete('reloaded');
      }
      if (searchParams.has('_t')) {
        console.log('[URL Cleaner] Removing _t parameter from URL');
        searchParams.delete('_t');
      }
      const cleanURL = window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      window.history.replaceState({}, '', cleanURL);
  }, []);
};

const useMetaTags = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    let title = 'Nelly Earnings Platform - Optimize Your Digital Income';
    let description = 'Join thousands of users earning through our optimized task platform. Complete your VIP tasks, bind your digital wallet, and withdraw your earnings easily.';
    let ogTitle = 'Nelly Earnings Platform - Optimize Your Digital Income';
    let ogDescription = description;

    if (pathname === '/match-feed') {
      title = 'Nelly Social Hub - Find Your Global Soulmate 🔮❤️‍🔥';
      description = 'Step inside the world\'s most exclusive premium connection network. Meet, flirt 🫦, and fall in love 💕 with breathtaking singles and global travelers instantly. Unlock timed blind audio matching rooms, group chats, and community exclusive rooms with seamless global chats right inside your hands! ស្វែងរកគូស្នេហ៍ពិតរបស់អ្នកនៅទីនេះ, ចែចង់ 🫦 ធ្លាក់ក្នុងអន្លង់ស្នេហ៍ 💕 ជាមួយអ្នកនៅលីវ និងអ្នកធ្វើដំណើរជុំវិញពិភពលោក, រួមទាំងក្រុមជជែកកំសាន្ត និងបន្ទប់សហគមន៍ផ្តាច់មុខ!';
      ogTitle = 'Nelly Social Hub - Find Your Global Soulmate 🔮❤️‍🔥';
      ogDescription = description;
    }

    document.title = title;

    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateNameTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('og:title', ogTitle);
    updateMetaTag('og:description', ogDescription);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:url', window.location.href);
    updateNameTag('description', description);

  }, [location]);
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isSocialRoute = ['/match-feed', '/voice-match', '/premium-chat'].includes(location.pathname);

  useCaseInsensitiveRouter();
  useURLParameterCleaner();
  useMetaTags();

  return (
    <>
      <PlatformSwitch />
      <Routes>
        {/* Strict Admin Routes - Top Priority */}
        <Route element={<MasterAdminRoute><Outlet /></MasterAdminRoute>}>
          <Route path="/admin" element={<AIAssistantWorkspace />} />
          <Route path="/admin-match" element={<AdminMatchDigitalHome />} />
          <Route path="/admin/command-deck" element={<AdminCommandDeck />} />
          <Route path="/admin/ai" element={<AIAssistantWorkspace />} />
        </Route>
        
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/tiktok6" element={<TikTokGate />} />
        <Route path="/soulmate" element={<TikTok6SoulmateHub />} />
          <Route path="/dating-cockpit" element={<TikTok6DatingCockpit />} />
          <Route path="/telegram-mini" element={<TelegramMiniView />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/ai-assistant" element={<AIAssistantWorkspace />} />
        </Route>
        
        {/* Profile Routes */}
        <Route path="/me" element={<UserProfilePage />} />
        
        {/* Social Routes */}
        <Route path="/match-feed" element={<MatchingFeed />} />
        <Route path="/voice-match" element={<AudioMatchRoom />} />
        <Route path="/premium-chat" element={<PremiumChatView />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/friends" element={<FriendsPage />} />
        
        {/* Dynamic User Parameter Routes - Lower Priority */}
        <Route path="/messages/:conversationId" element={<MessageConversation />} />
        <Route path="/story/:storyId" element={<StoryViewer />} />
        <Route path="/profile/:userId" element={<CreatorProfile />} />
        
        {/* Catch-all Fallback - Lowest Priority */}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <AppProvider>
                <CSNotificationProvider>
                  <Toaster />
                  <Sonner />
                  <AppContent />
                </CSNotificationProvider>
              </AppProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
