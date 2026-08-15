import React, { useState } from 'react';
import GlitterBlock from '../GlitterBlock';

type StreamSubTab = 'following' | 'foryou' | 'latest';

const StreamTab: React.FC = () => {
  const [subTab, setSubTab] = useState<StreamSubTab>('foryou');

  const streams = [
    { id: '1', title: 'Executive Strategy Session', host: 'SREYMARA HQ', viewers: '1.2K', category: 'Business' },
    { id: '2', title: 'AI & Automation Workshop', host: 'Tech Lab', viewers: '890', category: 'Tech' },
    { id: '3', title: 'Live Matchmaking Event', host: 'Match Engine', viewers: '2.4K', category: 'Social' },
    { id: '4', title: 'Crypto Market Analysis', host: 'Solana Desk', viewers: '1.5K', category: 'Finance' },
  ];

  return (
    <div className="space-y-4 py-2">
      {/* Sub-tabs */}
      <div className="flex bg-slate-900/60 border border-rose-500/20 p-1 gap-1">
        {(['following', 'foryou', 'latest'] as StreamSubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`
              flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-all
              ${subTab === tab
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(220,20,60,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            {tab === 'foryou' ? 'For You' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Stream Grid */}
      <div className="space-y-3">
        {streams.map((stream) => (
          <GlitterBlock key={stream.id} glowColor="crimson" padding="md">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-200 mb-1">{stream.title}</div>
                <div className="text-[10px] text-slate-400">by {stream.host}</div>
              </div>
              <div className="flex items-center gap-1 bg-slate-800/60 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] text-red-400 font-mono">{stream.viewers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 tracking-widest uppercase">{stream.category}</span>
              <button className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[9px] font-bold tracking-widest uppercase hover:bg-rose-500/30 transition-all">
                Watch
              </button>
            </div>
          </GlitterBlock>
        ))}
      </div>
    </div>
  );
};

export default StreamTab;
