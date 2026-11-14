import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const cybernodeSupabase = createClient(
  import.meta.env.VITE_CYBERNODE_SUPABASE_URL || '',
  import.meta.env.VITE_CYBERNODE_SUPABASE_ANON_KEY || ''
);
import {
  Activity,
  Zap,
  ShieldCheck,
} from 'lucide-react';

const GRAM_USD_RATE = 1.35;
const MIN_WITHDRAWAL = 2.00;

function formatGram(val: number): string {
  return Number(val).toFixed(6);
}

export default function CyberNodeDashboard() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balanceGram, setBalanceGram] = useState(0);
  const [miningSpeed, setMiningSpeed] = useState(0.051);
  const [isMining, setIsMining] = useState(false);
  const [lastMinedAt, setLastMinedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAuthLoading(false);
  }, []);
  return (
    <div className="min-h-screen bg-[#050a14] text-white p-4 md:p-6 font-mono selection:bg-cyan-500/30">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : authUser ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1322] p-5 rounded-2xl border border-cyan-500/25 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
              <Activity size={22} strokeWidth={2.5} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-cyan-300 tracking-tight">CyberNode VIP</h1>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">Cloud Mining Core • TON Staking • TonKeeper Payouts</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-end">
            <span className={`text-[11px] px-3 py-1.5 rounded-md font-bold ${walletConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {walletConnected ? `Linked ✓ ${walletAddress.slice(0, 6)}...` : 'Not Connected'}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono flex items-center gap-3">
            <ShieldCheck size={16} strokeWidth={2} />
            <span>{error}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-[#0d1322] p-6 rounded-2xl border border-cyan-500/25">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Accumulated Cloud Balance</div>
                <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  <Zap size={14} strokeWidth={2} />
                  <span>LIVE ACCRUAL</span>
                </div>
              </div>

              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-blue-300 mb-1">
                {formatGram(balanceGram)}
              </div>
              <div className="text-sm text-gray-300 mb-4">
                <span className="font-bold text-white">{usdValue.toFixed(2)} USD</span>
                <span className="text-gray-500 ml-2">(@ ${GRAM_USD_RATE}/GRAM Oracle)</span>
            <div className="flex gap-4">
              <div className="bg-[#111827] p-4 rounded-xl flex-1 border border-gray-800/50">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Daily Mining Speed</div>
                <div className="text-lg font-bold text-green-400">~+{formatGram(miningSpeed)} GRAM/Day</div>
              </div>
              <div className="bg-[#111827] p-4 rounded-xl flex-1 border border-gray-800/50">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Active Hash Rate</div>
                <div className="text-lg font-bold text-cyan-400">48.2 MH/s</div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isMining ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
              <span className="text-xs font-bold {isMining ? 'text-green-400' : 'text-gray-500'}">
                {isMining ? 'MINING ACTIVE' : 'MINING IDLE'}
              </span>
              <span className="text-[10px] text-gray-500 ml-2">Last tick: {lastMinedAt ? new Date(lastMinedAt).toLocaleTimeString() : '--'}</span>
            </div>
          </div>

          <div className="bg-[#0d1322] p-6 rounded-2xl border border-cyan-500/25 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase text-cyan-400 font-bold">Automated Cloud Rig</span>
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">ONLINE</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">
                Zero hardware wear. Smart contract payouts streamed directly to your connected TonKeeper address.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="text-center text-[10px] text-gray-600 mt-8">
        CyberNode Earnings Engine • earnings.ink/cybernode • Non-custodial TON staking via TonKeeper
      </div>

      <div className="flex items-center justify-center min-h-screen bg-[#050a14]/90 backdrop-blur-sm">
        <div className="bg-[#0d1322] p-8 rounded-2xl border border-cyan-500/30 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-cyan-400">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {authMode === 'signin' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {authError}
            </div>
          )}

          <form
            onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-[#050a14] border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full bg-[#050a14] border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold hover:from-cyan-400 hover:to-blue-500 transition"
            >
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
              </div>

              <div className="relative w-full h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    stroke="#1a202c"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    stroke="url(#cyberGradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${progressToWithdraw * 2.64} 264`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">{formatGram(balanceGram)} GRAM</div>
                  <div className="text-[10px] text-gray-400 mt-1">to ${MIN_WITHDRAWAL} GRAM Withdrawal</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{progressToWithdraw.toFixed(0)}% to threshold</div>
                </div>
              </div>
            </div>

  const progressToWithdraw = Math.min((balanceGram / MIN_WITHDRAWAL) * 100, 100);
  const usdValue = balanceGram * GRAM_USD_RATE;