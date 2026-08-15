import React from 'react';
import GlitterBlock from '../GlitterBlock';

const HomeTab: React.FC = () => {
  return (
    <div className="space-y-3 py-1">
      <GlitterBlock glowColor="crimson" padding="lg" className="text-center">
        <div className="text-[10px] text-rose-400 tracking-[0.35em] font-black mb-1">WELCOME TO</div>
        <h2 className="text-3xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-red-500 to-orange-500">
          SREYMARA
        </h2>
        <p className="text-[10px] text-slate-500 tracking-[0.35em] uppercase font-bold">Executive Private Network</p>
      </GlitterBlock>

      <div className="grid grid-cols-2 gap-2">
        <GlitterBlock glowColor="teal" padding="md" className="text-center">
          <div className="text-[10px] text-slate-500 tracking-[0.25em] uppercase font-bold mb-1">Balance</div>
          <div className="text-xl font-black text-teal-400 sreymara-mono">0.00</div>
          <div className="text-[9px] text-slate-600">SOL</div>
        </GlitterBlock>
        <GlitterBlock glowColor="gold" padding="md" className="text-center">
          <div className="text-[10px] text-slate-500 tracking-[0.25em] uppercase font-bold mb-1">Status</div>
          <div className="text-xl font-black text-yellow-400">VIP</div>
          <div className="text-[9px] text-slate-600">ACTIVE</div>
        </GlitterBlock>
      </div>

      <div className="space-y-2">
        <GlitterBlock glowColor="crimson" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-200 mb-0.5">Live Matchmaking</div>
              <div className="text-[10px] text-slate-500">5 engines available</div>
            </div>
            <div className="text-rose-400 text-xl">◉</div>
          </div>
        </GlitterBlock>

        <GlitterBlock glowColor="cyan" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-200 mb-0.5">AI Editor</div>
              <div className="text-[10px] text-slate-500">Gemini 3.6 Flash</div>
            </div>
            <div className="text-cyan-400 text-xl">◆</div>
          </div>
        </GlitterBlock>

        <GlitterBlock glowColor="teal" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-200 mb-0.5">Solana Vault</div>
              <div className="text-[10px] text-slate-500">Master wallet bound</div>
            </div>
            <div className="text-teal-400 text-xl">◈</div>
          </div>
        </GlitterBlock>
      </div>
    </div>
  );
};

export default HomeTab;
