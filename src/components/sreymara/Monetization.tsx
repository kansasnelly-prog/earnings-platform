import React from 'react';
import GlitterBlock from './GlitterBlock';

const Monetization: React.FC = () => {
  return (
    <div className="space-y-3 py-2">
      <div className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">
        Direct Link Monetization
      </div>

      {/* Adsterra */}
      <GlitterBlock glowColor="gold" padding="md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-slate-200 mb-0.5">Adsterra Direct Link</div>
            <div className="text-[10px] text-slate-400">Opens in external tab</div>
          </div>
          <div className="text-yellow-400 text-lg">◈</div>
        </div>
        <a
          href="https://www.effectivecpmnetwork.com/rrnk5md1t?key=1a5a431a3c76133326c81fd10b5bd2e6"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 text-center bg-slate-800/60 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold tracking-widest uppercase hover:border-yellow-500/60 hover:shadow-[0_0_12px_rgba(234,179,8,0.3)] transition-all"
        >
          Open Adsterra Link
        </a>
      </GlitterBlock>

      {/* Monetag */}
      <GlitterBlock glowColor="crimson" padding="md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-slate-200 mb-0.5">Monetag SmartLink</div>
            <div className="text-[10px] text-slate-400">Smart monetization link</div>
          </div>
          <div className="text-rose-400 text-lg">◆</div>
        </div>
        <a
          href="https://omg10.com/4/11528175"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 text-center bg-slate-800/60 border border-rose-500/30 text-rose-400 text-[10px] font-bold tracking-widest uppercase hover:border-rose-500/60 hover:shadow-[0_0_12px_rgba(220,20,60,0.3)] transition-all"
        >
          Open Monetag Link
        </a>
      </GlitterBlock>

      {/* Bot Integration */}
      <GlitterBlock glowColor="cyan" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200 mb-0.5">Telegram Bot</div>
            <div className="text-[10px] text-slate-400">@OnlineCustomerOptimizeTasksBot</div>
          </div>
          <a
            href="https://t.me/OnlineCustomerOptimizeTasksBot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[9px] font-bold tracking-widest uppercase hover:bg-cyan-500/30 transition-all"
          >
            OPEN
          </a>
        </div>
      </GlitterBlock>

      <div className="text-[9px] text-slate-600 text-center pt-2">
        No popups or overlays. Direct links only.
      </div>
    </div>
  );
};

export default Monetization;
