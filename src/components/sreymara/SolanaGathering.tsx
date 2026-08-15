import React, { useState } from 'react';
import GlitterBlock from './GlitterBlock';

const MASTER_WALLET = '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

const SolanaGathering: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isBound, setIsBound] = useState(false);
  const [gathered, setGathered] = useState(0);
  const [target] = useState(100);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [status, setStatus] = useState('');

  const progress = Math.min((gathered / target) * 100, 100);

  const bindWallet = () => {
    if (!walletAddress.trim()) return;
    setIsBound(true);
    setStatus('Wallet bound to master vault');
  };

  const simulateGather = () => {
    if (gathered >= target) return;
    setGathered((prev) => Math.min(prev + Math.random() * 15 + 5, target));
  };

  const flushWithdraw = async () => {
    if (!isBound || gathered < 10) return;
    setIsWithdrawing(true);
    setStatus('Initiating withdrawal to master wallet...');
    
    setTimeout(() => {
      setStatus(`Withdrawn ${gathered.toFixed(2)} SOL to ${MASTER_WALLET.slice(0, 8)}...`);
      setGathered(0);
      setIsWithdrawing(false);
    }, 2000);
  };

  return (
    <GlitterBlock glowColor="teal" padding="md">
      <div className="text-[10px] text-teal-400 tracking-[0.2em] uppercase font-bold mb-3">
        Solana Token Gathering
      </div>

      {/* Wallet Binding */}
      <div className="mb-4">
        <label className="text-[10px] text-slate-400 tracking-widest uppercase block mb-1.5">
          Bind Solana Wallet
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter wallet address..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            disabled={isBound}
            className="flex-1 bg-slate-900/60 border border-teal-500/20 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={bindWallet}
            disabled={isBound}
            className={`
              px-4 py-2 text-[10px] font-bold tracking-widest uppercase border transition-all
              ${isBound
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-teal-500/20 border-teal-500/50 text-teal-400 hover:bg-teal-500/30'
              }
            `}
          >
            {isBound ? 'BOUND' : 'BIND'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 tracking-widest uppercase">Aggregation Progress</span>
          <span className="text-[10px] text-teal-400 font-mono">{gathered.toFixed(1)} / {target}</span>
        </div>
        <div className="h-2 bg-slate-800 border border-teal-500/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={simulateGather}
          disabled={gathered >= target}
          className="flex-1 py-2 bg-slate-800/60 border border-teal-500/30 text-teal-400 text-[10px] font-bold tracking-widest uppercase hover:border-teal-500/60 transition-all disabled:opacity-50"
        >
          GATHER
        </button>
        <button
          onClick={flushWithdraw}
          disabled={!isBound || gathered < 10 || isWithdrawing}
          className="flex-1 py-2 bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[10px] font-bold tracking-widest uppercase hover:bg-rose-500/30 transition-all disabled:opacity-50"
        >
          {isWithdrawing ? 'WITHDRAWING...' : 'FLUSH'}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className="text-[10px] text-slate-400 bg-slate-900/40 p-2 border border-slate-700">
          {status}
        </div>
      )}

      {/* Master Wallet Display */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="text-[9px] text-slate-500 tracking-widest uppercase mb-1">Master Vault</div>
        <div className="text-[10px] text-slate-400 font-mono break-all">{MASTER_WALLET}</div>
      </div>
    </GlitterBlock>
  );
};

export default SolanaGathering;
