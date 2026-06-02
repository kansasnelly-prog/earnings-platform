import React from 'react';
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
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />}> 
          <Route index element={<Admin />} />
        </Route>
      </Routes>
    );
  }

  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<ProtectedRoute />}> 
            <Route path="/ai-assistant" element={<AIAssistantWorkspace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LanguageProvider>
              <CSNotificationProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </CSNotificationProvider>
            </LanguageProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
