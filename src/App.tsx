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

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Apply case-insensitive router firewall
  useCaseInsensitiveRouter();

  // Apply URL parameter cleaner interceptor
  useURLParameterCleaner();

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
        <Route path="/match-admin" element={<MatchDashboard />} />
      </Route>
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
