import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

interface SREYMARALayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showAIEditor?: boolean;
  showSolanaPanel?: boolean;
}

const SREYMARALayout: React.FC<SREYMARALayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  showAIEditor = false,
  showSolanaPanel = false,
}) => {
  const [tgReady, setTgReady] = useState(false);
  const [viewport, setViewport] = useState({ height: window.innerHeight, width: window.innerWidth });

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      setTgReady(true);
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

  return (
    <div
      className="min-h-screen bg-[#05070a] text-white flex flex-col overflow-hidden"
      style={{
        height: viewport.height,
        maxWidth: viewport.width > 768 ? '480px' : '100%',
        margin: viewport.width > 768 ? '0 auto' : '0',
        borderLeft: viewport.width > 768 ? '1px solid rgba(220,20,60,0.3)' : 'none',
        borderRight: viewport.width > 768 ? '1px solid rgba(220,20,60,0.3)' : 'none',
      }}
    >
      {/* Glittering animated top header */}
      <div className="relative px-4 pt-4 pb-2 bg-gradient-to-b from-slate-900 to-transparent z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(220,20,60,0.15),_transparent_70%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-xs font-bold tracking-wider">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.3em] text-rose-400 uppercase">SREYMARA</h1>
              <p className="text-[10px] text-slate-500 tracking-widest">EXECUTIVE NETWORK</p>
            </div>
          </div>
          {showSolanaPanel && (
            <div className="flex items-center gap-1 bg-slate-800/60 border border-rose-500/30 px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono">SOL</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation - 4-corner block style */}
      <nav className="relative z-20 px-2 pb-2">
        <div className="flex bg-slate-900/60 border border-rose-500/20 p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 py-2 px-1 text-[10px] font-bold tracking-widest uppercase transition-all duration-300
                flex flex-col items-center gap-0.5
                ${activeTab === tab.id
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(220,20,60,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }
              `}
            >
              <span className="text-sm leading-none">{tab.icon}</span>
              <span className="leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-20 z-10 scrollbar-thin">
        {children}
      </main>

      {/* AI Editor floating toolbar */}
      {showAIEditor && (
        <div className="fixed bottom-16 left-3 right-3 z-30 md:left-auto md:right-4 md:bottom-20 md:w-80">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 p-2 shadow-[0_0_20px_rgba(220,20,60,0.2)]">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] text-rose-400 font-bold tracking-widest">AI EDITOR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-rose-500/40 to-transparent" />
            </div>
            <div className="flex gap-1">
              {['Translate', 'Style', 'Fix', 'Gemini'].map((action) => (
                <button
                  key={action}
                  className="flex-1 py-1.5 text-[9px] font-bold tracking-wider uppercase bg-slate-800/60 border border-slate-700 text-slate-300 hover:border-rose-500/50 hover:text-rose-400 transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom profile avatar (allowed to be round per requirements) */}
      <div className="fixed bottom-2 left-3 z-40">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-rose-500/50 overflow-hidden shadow-[0_0_12px_rgba(220,20,60,0.4)]">
            <div className="w-full h-full bg-gradient-to-br from-rose-500/20 to-transparent flex items-center justify-center">
              <span className="text-xs font-bold text-rose-400">S</span>
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#05070a]" />
        </div>
      </div>

      {/* Glittering bottom border line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-60 z-50" />
    </div>
  );
};

export default SREYMARALayout;
