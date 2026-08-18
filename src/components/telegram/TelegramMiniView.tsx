import React, { useState, useEffect } from 'react';
import HomeTab from '@/components/sreymara/tabs/HomeTab';
import ExploreTab from '@/components/sreymara/tabs/ExploreTab';
import LiveTab from '@/components/sreymara/tabs/LiveTab';
import ActiveTab from '@/components/sreymara/tabs/ActiveTab';
import StreamTab from '@/components/sreymara/tabs/StreamTab';
import SolanaGathering from '@/components/sreymara/SolanaGathering';
import AIEditorToolbar from '@/components/sreymara/AIEditorToolbar';
import GeminiChatOverlay from '@/components/sreymara/GeminiChatOverlay';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

const TelegramMiniView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [tgReady, setTgReady] = useState(false);
  const [viewport, setViewport] = useState({ height: window.innerHeight, width: window.innerWidth });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        setTgReady(true);
      } catch (e) {
        console.warn('[SREYMARA] Telegram WebApp init failed', e);
      }
    }

    const handleResize = () => {
      setViewport({ height: window.innerHeight, width: window.innerWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs = [
    { id: 'home', label: 'HOME', icon: '⌂' },
    { id: 'explore', label: 'EXPLORE', icon: '◈' },
    { id: 'live', label: 'LIVE', icon: '◉' },
    { id: 'active', label: 'ACTIVE', icon: '◆' },
    { id: 'stream', label: 'STREAM', icon: '▷' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-4 py-1">
            <HomeTab />
            <SolanaGathering />
          </div>
        );
      case 'explore':
        return (
          <div className="space-y-4 py-1">
            <ExploreTab />
            <AIEditorToolbar />
          </div>
        );
      case 'live':
        return <LiveTab />;
      case 'active':
        return <ActiveTab />;
      case 'stream':
        return <StreamTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div
      className="sreymara-tma-shell min-h-screen flex flex-col overflow-hidden"
      style={{
        height: viewport.height,
        maxWidth: viewport.width > 768 ? '480px' : '100%',
        margin: viewport.width > 768 ? '0 auto' : '0',
        borderLeft: viewport.width > 768 ? '1px solid rgba(220,20,60,0.25)' : 'none',
        borderRight: viewport.width > 768 ? '1px solid rgba(220,20,60,0.25)' : 'none',
      }}
    >
      {/* Header */}
      <div className="relative px-4 pt-4 pb-3 z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(220,20,60,0.14),_transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-sm font-black tracking-wider text-white">
              S
            </div>
            <div>
              <h1 className="sreymara-executive-title text-sm text-rose-400">SREYMARA</h1>
              <p className="text-[10px] text-slate-500 tracking-[0.35em] uppercase">Executive Network</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/70 border border-rose-500/25 px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="sreymara-mono text-[10px] text-emerald-400">SOL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Tab Navigation */}
      <nav className="relative z-20 px-2 pb-2">
        <div className="flex bg-slate-900/70 border border-rose-500/15 p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2.5 px-1 text-[10px] font-black tracking-[0.18em] uppercase transition-all duration-200
                flex flex-col items-center gap-1 leading-none
                ${activeTab === tab.id
                  ? 'bg-rose-500/18 text-rose-400 border border-rose-500/45 shadow-[0_0_14px_rgba(220,20,60,0.25)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                }
              `}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-24 z-10 sreymara-scroll">
        {renderContent()}
      </main>

      {/* Floating AI Editor */}
      <div className="fixed bottom-16 left-3 right-3 z-30 md:left-auto md:right-4 md:bottom-20 md:w-[22rem]">
        <div className="sreymara-block-gold p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-yellow-400 font-black tracking-[0.25em]">AI EDITOR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent" />
          </div>
          <div className="flex gap-1">
            {['TRANSLATE', 'STYLE', 'FIX', 'GEMINI'].map((action) => (
              <button
                key={action}
                className="flex-1 py-2 text-[9px] font-black tracking-widest uppercase bg-slate-900/70 border border-yellow-500/25 text-yellow-300 hover:border-yellow-500/55 hover:text-yellow-200 transition-all"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Round profile avatar (only allowed round element) */}
      <div className="fixed bottom-3 left-3 z-40">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-rose-500/60 overflow-hidden shadow-[0_0_18px_rgba(220,20,60,0.45)]">
            <div className="w-full h-full bg-gradient-to-br from-rose-500/25 to-transparent flex items-center justify-center">
              <span className="text-sm font-black text-rose-400">S</span>
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#05070a]" />
        </div>
      </div>

      {/* Bottom luxury accent line */}
      <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-70 z-50" />

      {/* Gemini AI Chat Overlay */}
      <GeminiChatOverlay />
    </div>
  );
};

export default TelegramMiniView;
