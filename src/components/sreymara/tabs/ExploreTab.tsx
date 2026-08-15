import React, { useState } from 'react';
import GlitterBlock from '../GlitterBlock';

const ExploreTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'networking', name: 'Executive Network', count: '2.4K', color: 'crimson' as const },
    { id: 'matchmaking', name: 'Matchmaking', count: '1.8K', color: 'teal' as const },
    { id: 'ai-tools', name: 'AI Studio', count: '956', color: 'gold' as const },
    { id: 'crypto', name: 'Solana Vault', count: '3.1K', color: 'cyan' as const },
    { id: 'streaming', name: 'Live Streams', count: '1.2K', color: 'crimson' as const },
    { id: 'monetize', name: 'Earn & Withdraw', count: '890', color: 'teal' as const },
  ];

  const trending = [
    { title: 'Soul Game Engine', subtitle: 'Blind audio matching', hot: true },
    { title: 'Voice Game', subtitle: 'Real-time voice rooms', hot: true },
    { title: 'AI Match Engine', subtitle: 'Gemini-powered matching', hot: false },
    { title: 'Party Match', subtitle: 'Group social events', hot: false },
    { title: 'Worldwide Match', subtitle: 'Global connections', hot: false },
  ];

  return (
    <div className="space-y-4 py-2">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search SREYMARA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/60 border border-rose-500/20 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60 transition-colors"
        />
        <div className="absolute right-3 top-2.5 text-rose-400 text-xs">⌕</div>
      </div>

      {/* Categories */}
      <div>
        <div className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">Categories</div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <GlitterBlock key={cat.id} glowColor={cat.color} padding="md">
              <div className="text-xs font-bold text-slate-200 mb-1">{cat.name}</div>
              <div className="text-[10px] text-slate-500">{cat.count} active</div>
            </GlitterBlock>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div>
        <div className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">Trending Now</div>
        <div className="space-y-2">
          {trending.map((item, idx) => (
            <GlitterBlock key={idx} glowColor={item.hot ? 'crimson' : 'teal'} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    {item.title}
                    {item.hot && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 tracking-wider">HOT</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</div>
                </div>
                <div className="text-slate-600 text-lg">›</div>
              </div>
            </GlitterBlock>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExploreTab;
