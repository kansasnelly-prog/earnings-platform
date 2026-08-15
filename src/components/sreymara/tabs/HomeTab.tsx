import React from 'react';
import GlitterBlock from '../GlitterBlock';

const HomeTab: React.FC = () => {
  return (
    <div className="space-y-4 py-2">
      {/* Hero Block */}
      <GlitterBlock glowColor="crimson" padding="lg" className="text-center">
        <div className="text-xs text-rose-400 tracking-[0.3em] font-bold mb-1">WELCOME TO</div>
        <h2 className="text-2xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-red-500 to-orange-500">
          SREYMARA
        </h2>
        <p className="text-[10px] text-slate-400 tracking-widest uppercase">Executive Private Network</p>
      </GlitterBlock>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <GlitterBlock glowColor="teal" padding="md" className="text-center">
          <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">Balance</div>
          <div className="text-lg font-bold text-teal-400 font-mono">0.00</div>
          <div className="text-[9px] text-slate-500">SOL</div>
        </GlitterBlock>
        <GlitterBlock glowColor="gold" padding="md" className="text-center">
          <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">Status</div>
          <div className="text-lg font-bold text-yellow-400">VIP</div>
          <div className="text-[9px] text-slate-500">ACTIVE</div>
        </GlitterBlock>
      </div>

      {/* Feature Cards */}
      <div className="space-y-2">
        <GlitterBlock glowColor="crimson" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200 mb-0.5">Live Matchmaking</div>
              <div className="text-[10px] text-slate-400">5 engines available</div>
            </div>
            <div className="text-rose-400 text-lg">◉</div>
          </div>
        </GlitterBlock>

        <GlitterBlock glowColor="cyan" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200 mb-0.5">AI Editor</div>
              <div className="text-[10px] text-slate-400">Gemini 3.6 Flash</div>
            </div>
            <div className="text-cyan-400 text-lg">◆</div>
          </div>
        </GlitterBlock>

        <GlitterBlock glowColor="teal" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200 mb-0.5">Solana Vault</div>
              <div className="text-[10px] text-slate-400">Master wallet bound</div>
            </div>
            <div className="text-teal-400 text-lg">◈</div>
          </div>
        </GlitterBlock>
      </div>

      {/* Direct Links Monetization */}
      <GlitterBlock glowColor="gold" padding="md">
        <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-2">Exclusive Offers</div>
        <div className="space-y-2">
          <a
            href="https://www.effectivecpmnetwork.com/rrnk5md1t?key=1a5a431a3c76133326c81fd10b5bd2e6"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 text-center bg-slate-800/60 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold tracking-widest uppercase hover:border-yellow-500/60 hover:shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all"
          >
            Adsterra Direct Link
          </a>
          <a
            href="https://omg10.com/4/11528175"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 text-center bg-slate-800/60 border border-rose-500/30 text-rose-400 text-[10px] font-bold tracking-widest uppercase hover:border-rose-500/60 hover:shadow-[0_0_10px_rgba(220,20,60,0.3)] transition-all"
          >
            Monetag SmartLink
          </a>
        </div>
      </GlitterBlock>
    </div>
  );
};

export default HomeTab;
