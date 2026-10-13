import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TelegramMiniView from './components/telegram/TelegramMiniView';
import OptimizationPlatform from './pages/Index';
import LandingPage from './pages/Index-simple';
import AdminCommandCenter from './pages/admin/command-center';
import AdminDirectory from './pages/admin/Directory';
import AIAssistantWorkspace from './pages/AIAssistantWorkspace';
import AdminDigitalHome from './pages/admin/index';
import AdminMatchDigitalHome from './pages/admin-match';
import AdminDashboard from './components/admin/AdminDashboard';
import EnhancedAdminDashboard from './components/admin/EnhancedAdminDashboard';
import RealAdminDashboard from './components/admin/RealAdminDashboard';
import SimpleAdminPanel from './components/admin/SimpleAdminPanel';
import TikTok6AdminMatch from './components/admin/TikTok6AdminMatch';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/SafeAuthProvider';
import { CSNotificationProvider } from './contexts/CSNotificationContext';

const TMAEntry: React.FC = () => {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.warn('[SREYMARA] Telegram WebApp init failed', e);
      }
    }
  }, []);

  return <TelegramMiniView />;
};

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div style={{ background: '#0f172a', height: '100vh' }} />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <CSNotificationProvider>
          <Routes>
            <Route path="/" element={<OptimizationPlatform />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/tg" element={<TMAEntry />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDirectory />
              </ProtectedRoute>
            } />
            <Route path="/admin/command-center" element={
              <ProtectedRoute>
                <AdminCommandCenter />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai-workspace" element={
              <ProtectedRoute>
                <AIAssistantWorkspace />
              </ProtectedRoute>
            } />
            <Route path="/admin/digital-home" element={
              <ProtectedRoute>
                <AdminDigitalHome />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/enhanced" element={
              <ProtectedRoute>
                <EnhancedAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/real" element={
              <ProtectedRoute>
                <RealAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/simple" element={
              <ProtectedRoute>
                <SimpleAdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/match" element={
              <ProtectedRoute>
                <AdminMatchDigitalHome />
              </ProtectedRoute>
            } />
            <Route path="/admin/tiktok6-match" element={
              <ProtectedRoute>
                <TikTok6AdminMatch />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CSNotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
