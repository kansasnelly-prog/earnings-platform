import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TelegramMiniView from './components/telegram/TelegramMiniView';
import OptimizationPlatform from './pages/Index';
import LandingPage from './pages/Index-simple';
import AdminCommandCenter from './pages/admin/command-center';
import AdminDirectory from './pages/admin/Directory';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/SafeAuthProvider';

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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
