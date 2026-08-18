import React, { useState } from 'react';
import GlitterBlock from '../GlitterBlock';
import { useTabNavigation } from '@/contexts/TabNavigationContext';

const ExploreTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { navigateTo } = useTabNavigation();

  const categories = [
    { id: 'networking', name: 'Executive Network', count: '2.4K', color: 'crimson' as const, tab: 'home' as const },
    { id: 'matchmaking', name: 'Matchmaking', count: '1.8K', color: 'teal' as const, tab: 'live' as const },
    { id: 'ai-tools', name: 'AI Studio', count: '956', color: 'gold' as const, tab: 'explore' as const },
    { id: 'crypto', name: 'Solana Vault', count: '3.1K', color: 'cyan' as const, tab: 'home' as const },
    { id: 'streaming', name: 'Live Streams', count: '1.2K', color: 'crimson' as const, tab: 'stream' as const },
    { id: 'monetize', name: 'Earn & Withdraw', count: '890', color: 'teal' as const, tab: 'home' as const },
  ];

  const trending = [
    { title: 'Soul Game Engine', subtitle: 'Blind audio matching', hot: true, tab: 'live' as const },
    { title: 'Voice Game', subtitle: 'Real-time voice rooms', hot: true, tab: 'live' as const },
    { title: 'AI Match Engine', subtitle: 'Gemini-powered matching', hot: false, tab: 'explore' as const },
    { title: 'Party Match', subtitle: 'Group social events', hot: false, tab: 'live' as const },
    { title: 'Worldwide Match', subtitle: 'Global connections', hot: false, tab: 'live' as const },
  ];

  const handleTrendingClick = async (item: typeof trending[0]) => {
    try {
      await fetch('/api/ads/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWalletAddress: localStorage.getItem('sreymara_bound_wallet') || '',
          adEngine: 'HILLTOP_DIRECT_LINK',
          eventType: 'trending_click',
        }),
      });
    } catch (error) {
      console.error('[ExploreTab] Telemetry failed:', error);
    }
    navigateTo(item.tab);
  };

  return (
    <div className="space-y-4 py-1">
      <div className="relative">
        <input
          type="text"
          placeholder="SEARCH SREYMARA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/70 border border-rose-500/20 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/60 transition-colors sreymara-mono"
        />
        <div className="absolute right-3 top-3 text-rose-400 text-xs">⌕</div>
      </div>

      <div>
        <div className="text-[10px] text-slate-600 tracking-[0.3em] uppercase font-black mb-2">Categories</div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <GlitterBlock key={cat.id} glowColor={cat.color} padding="md">
              <div
                className="cursor-pointer"
                onClick={() => navigateTo(cat.tab)}
              >
                <div className="text-xs font-black text-slate-200 mb-1">{cat.name}</div>
                <div className="text-[10px] text-slate-600 sreymara-mono">{cat.count} active</div>
              </div>
            </GlitterBlock>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-slate-600 tracking-[0.3em] uppercase font-black mb-2">Trending Now</div>
        <div className="space-y-2">
          {trending.map((item, idx) => (
            <GlitterBlock key={idx} glowColor={item.hot ? 'crimson' : 'teal'} padding="md">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleTrendingClick(item)}
              >
                <div>
                  <div className="text-xs font-black text-slate-200 flex items-center gap-2">
                    {item.title}
                    {item.hot && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 tracking-wider font-black">HOT</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.subtitle}</div>
                </div>
                <div className="text-slate-700 text-lg">›</div>
              </div>
            </GlitterBlock>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExploreTab;
