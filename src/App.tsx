import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './contexts/LanguageContext';
import { CSNotificationProvider } from './contexts/CSNotificationContext';
import { AuthProvider } from './contexts/SafeAuthProvider';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import Admin from './pages/Admin';
import AIAssistantWorkspace from './pages/AIAssistantWorkspace';
import MatchDashboard from './components/matchmaking/MatchDashboard';
import MatchingFeed from './components/social/MatchingFeed';
import AudioMatchRoom from './components/social/AudioMatchRoom';
import PremiumChatView from './components/social/PremiumChatView';
import NotFound from './pages/NotFound';
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

// PWA Install Detection Hook
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
      // Award +10 NellyCoin bonus
      await awardDownloadBonus(user.id);
    }

    setDeferredPrompt(null);
  };

  return { deferredPrompt, handleInstall };
};

// Award download bonus function
const awardDownloadBonus = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('download_bonus_awarded, balance')
      .eq('id', userId)
      .single();

    if (profile && !profile.download_bonus_awarded) {
      // Detect device type
      const userAgent = navigator.userAgent;
      let deviceType = 'web';
      if (/Android/i.test(userAgent)) {
        deviceType = 'android';
      } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        deviceType = 'ios';
      } else if (/Electron/i.test(userAgent)) {
        deviceType = 'desktop';
      }

      // Update profile with device info and award bonus
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

// MODULE 1: Case-Insensitive Router Firewall
const useCaseInsensitiveRouter = () => {
  useEffect(() => {
    const pathname = window.location.pathname;
    const lowercasePath = pathname.toLowerCase();

    // If the current pathname contains uppercase letters, force lowercase
    if (pathname !== lowercasePath) {
      console.log('[Router Firewall] Forcing lowercase URL:', pathname, '->', lowercasePath);
      window.history.replaceState({}, '', lowercasePath);
    }
  }, []);
};

// MODULE 2: URL Parameter Cleaner Interceptor
const useURLParameterCleaner = () => {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    // Check if 'reloaded=true' parameter exists
    if (searchParams.has('reloaded') && searchParams.get('reloaded') === 'true') {
      console.log('[URL Cleaner] Removing reloaded=true parameter from URL');
      searchParams.delete('reloaded');
      const cleanURL = window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      window.history.replaceState({}, '', cleanURL);
    }
  }, []);
};

// MODULE 3: Dynamic Dual-Language OpenGraph Meta Tags
const useMetaTags = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    // Default meta tags
    let title = 'Nelly Earnings Platform - Optimize Your Digital Income';
    let description = 'Join thousands of users earning through our optimized task platform. Complete your VIP tasks, bind your digital wallet, and withdraw your earnings easily.';
    let ogTitle = 'Nelly Earnings Platform - Optimize Your Digital Income';
    let ogDescription = description;

    // Match Feed specific meta tags with dual-language EN/KM
    if (pathname === '/match-feed') {
      title = 'Nelly Social Hub - Find Your Global Soulmate 🔮❤️‍🔥';
      description = 'Step inside the world\'s most exclusive premium connection network. Meet, flirt 🫦, and fall in love 💕 with breathtaking singles and global travelers instantly. Unlock timed blind audio matching rooms, group chats, and community exclusive rooms with seamless global chats right inside your hands! ស្វែងរកគូស្នេហ៍ពិតរបស់អ្នកនៅទីនេះ, ចែចង់ 🫦 ធ្លាក់ក្នុងអន្លង់ស្នេហ៍ 💕 ជាមួយអ្នកនៅលីវ និងអ្នកធ្វើដំណើរជុំវិញពិភពលោក, រួមទាំងក្រុមជជែកកំសាន្ត និងបន្ទប់សហគមន៍ផ្តាច់មុខ!';
      ogTitle = 'Nelly Social Hub - Find Your Global Soulmate 🔮❤️‍🔥';
      ogDescription = description;
    }

    // Update document title
    document.title = title;

    // Update or create OpenGraph meta tags
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
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isMatchAdminRoute = location.pathname === '/match-admin';
  const isSocialRoute = ['/match-feed', '/voice-match', '/premium-chat'].includes(location.pathname);

  // Apply case-insensitive router firewall
  useCaseInsensitiveRouter();

  // Apply URL parameter cleaner interceptor
  useURLParameterCleaner();

  // Apply dynamic meta tags
  useMetaTags();

  // Isolate match-admin route from home dashboard redirect hooks
  if (isMatchAdminRoute) {
    return (
      <Routes>
        <Route path="/match-admin" element={<MatchDashboard />} />
      </Routes>
    );
  }

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AIAssistantWorkspace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/ai-assistant" element={<AIAssistantWorkspace />} />
      </Route>
      {/* Social routes - accessible directly without ProtectedRoute */}
      <Route path="/match-feed" element={<MatchingFeed />} />
      <Route path="/voice-match" element={<AudioMatchRoom />} />
      <Route path="/premium-chat" element={<PremiumChatView />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {/* Single AuthProvider wrapping the whole app */}
            <AuthProvider>
              {/* AppProvider now envelops the entire routing tree */}
              <AppProvider>
                <LanguageProvider>
                  <CSNotificationProvider>
                    <Toaster />
                    <Sonner />
                    <AppContent />
                  </CSNotificationProvider>
                </LanguageProvider>
              </AppProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
