import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { CSNotificationProvider } from './contexts/CSNotificationContext';
import { AuthProvider } from './contexts/SafeAuthProvider';
import { AppProvider } from './contexts/AppContext';

const ErrorBoundary = React.lazy(() => import('./components/ErrorBoundary'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute').then(m => ({ default: (m as any).default })));
const MasterAdminRoute = React.lazy(() => import('./components/ProtectedRoute').then(m => ({ default: m.MasterAdminRoute })));
const PlatformSwitch = React.lazy(() => import('./components/PlatformSwitch'));
const Index = React.lazy(() => import('./pages/Index'));
const TikTokGate = React.lazy(() => import('./pages/TikTokGate'));

const AdminCommandDeck = React.lazy(() => import('./components/admin/AdminCommandDeck'));
const GeminiStudioCommand = React.lazy(() => import('./components/admin/GeminiStudioCommand'));
const AudiomackCreator = React.lazy(() => import('./pages/AudiomackCreator'));

const AIAssistantWorkspace = React.lazy(() => import('./pages/AIAssistantWorkspace'));
const DigitalHome = React.lazy(() => import('./pages/admin/index'));
const EnhancedAdminDashboard = React.lazy(() => import('./components/admin/EnhancedAdminDashboard'));
const AdminMatchDigitalHome = React.lazy(() => import('./pages/admin-match/index'));
const TikTok6SoulmateHub = React.lazy(() => import('./pages/TikTok6SoulmateHub'));
const TikTok6DatingCockpit = React.lazy(() => import('./pages/TikTok6DatingCockpit'));
const TikTok6MonetizationCockpit = React.lazy(() => import('./pages/TikTok6MonetizationCockpit').then(m => ({ default: m.TikTok6MonetizationCockpit })));
const MatchDashboard = React.lazy(() => import('./components/matchmaking/MatchDashboard'));
const MatchingFeed = React.lazy(() => import('./components/social/MatchingFeed'));
const AudioMatchRoom = React.lazy(() => import('./components/social/AudioMatchRoom'));
const PremiumChatView = React.lazy(() => import('./components/social/PremiumChatView'));
const Inbox = React.lazy(() => import('./components/social/Inbox'));
const MessageConversation = React.lazy(() => import('./components/social/MessageConversation'));
const StoryViewer = React.lazy(() => import('./components/social/StoryViewer'));
const ExplorePage = React.lazy(() => import('./components/social/ExplorePage'));
const CreatorProfile = React.lazy(() => import('./components/social/CreatorProfile'));
const FriendsPage = React.lazy(() => import('./components/social/FriendsPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const UserProfilePage = React.lazy(() => import('./pages/TikTok6MeProfile'));
const TelegramMiniView = React.lazy(() => import('./components/telegram/TelegramMiniView'));
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/SafeAuthProvider';

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

  const lazyFallback = (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-slate-400">Loading...</div>
    </div>
  );

  return (
    <>
      <PlatformSwitch />
      <Routes>
        {/* Strict Admin Routes - Top Priority */}
        <Route element={<MasterAdminRoute><Outlet /></MasterAdminRoute>}>
          <Route path="/admin" element={<Suspense fallback={lazyFallback}><EnhancedAdminDashboard /></Suspense>} />
          <Route path="/admin/command-center" element={<Suspense fallback={lazyFallback}><GeminiStudioCommand /></Suspense>} />

          <Route path="/admin-match" element={<Suspense fallback={lazyFallback}><AdminMatchDigitalHome /></Suspense>} />
          <Route path="/admin/command-deck" element={<Suspense fallback={lazyFallback}><AdminCommandDeck /></Suspense>} />
          <Route path="/admin/ai" element={<Suspense fallback={lazyFallback}><AIAssistantWorkspace /></Suspense>} />
          {/* Ghost routes - render within main /admin shell */}
          <Route path="/admin/users" element={<Suspense fallback={lazyFallback}><EnhancedAdminDashboard /></Suspense>} />
          <Route path="/admin/payouts" element={<Suspense fallback={lazyFallback}><EnhancedAdminDashboard /></Suspense>} />
          <Route path="/admin/tasks" element={<Suspense fallback={lazyFallback}><EnhancedAdminDashboard /></Suspense>} />
          <Route path="/admin/settings" element={<Suspense fallback={lazyFallback}><EnhancedAdminDashboard /></Suspense>} />
        </Route>
        
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/tiktok6" element={<TikTokGate />} />
        <Route path="/soulmate" element={<Suspense fallback={lazyFallback}><TikTok6SoulmateHub /></Suspense>} />
          <Route path="/dating-cockpit" element={<Suspense fallback={lazyFallback}><TikTok6DatingCockpit /></Suspense>} />
          <Route path="/monetization-cockpit" element={<Suspense fallback={lazyFallback}><TikTok6MonetizationCockpit /></Suspense>} />
          <Route path="/telegram-mini" element={<Suspense fallback={lazyFallback}><TelegramMiniView /></Suspense>} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/ai-assistant" element={<Suspense fallback={lazyFallback}><AIAssistantWorkspace /></Suspense>} />
          <Route path="/audiomack-creator" element={<Suspense fallback={lazyFallback}><AudiomackCreator /></Suspense>} />
        </Route>
        
        {/* Profile Routes */}
        <Route path="/me" element={<Suspense fallback={lazyFallback}><UserProfilePage /></Suspense>} />
        
        {/* Social Routes */}
        <Route path="/match-feed" element={<Suspense fallback={lazyFallback}><MatchingFeed /></Suspense>} />
        <Route path="/voice-match" element={<Suspense fallback={lazyFallback}><AudioMatchRoom /></Suspense>} />
        <Route path="/premium-chat" element={<Suspense fallback={lazyFallback}><PremiumChatView /></Suspense>} />
        <Route path="/inbox" element={<Suspense fallback={lazyFallback}><Inbox /></Suspense>} />
        <Route path="/friends" element={<Suspense fallback={lazyFallback}><FriendsPage /></Suspense>} />
        
        {/* Dynamic User Parameter Routes - Lower Priority */}
        <Route path="/messages/:conversationId" element={<Suspense fallback={lazyFallback}><MessageConversation /></Suspense>} />
        <Route path="/story/:storyId" element={<Suspense fallback={lazyFallback}><StoryViewer /></Suspense>} />
        <Route path="/profile/:userId" element={<Suspense fallback={lazyFallback}><CreatorProfile /></Suspense>} />
        
        {/* Catch-all Fallback - Lowest Priority */}
        <Route path="/explore" element={<Suspense fallback={lazyFallback}><ExplorePage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={lazyFallback}><NotFound /></Suspense>} />
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
