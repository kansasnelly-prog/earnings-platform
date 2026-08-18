import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import TelegramMiniView from './components/telegram/TelegramMiniView';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div style={{ background: '#0f172a', height: '100vh' }} />;
  }

  return <TelegramMiniView />;
}
