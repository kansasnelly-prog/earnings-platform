import React, { useEffect, useState } from 'react';

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

  const progressToWithdraw = Math.min((balanceGram / MIN_WITHDRAWAL) * 100, 100);
  const usdValue = balanceGram * GRAM_USD_RATE;

  return (
    <div className="min-h-screen bg-[#050a14] text-white p-4 md:p-6 font-mono selection:bg-cyan-500/30">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : authUser ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1322] p-5 rounded-2xl border border-cyan-500/25 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-cyan-300 tracking-tight">CyberNode VIP</h1>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono flex items-center gap-3">
            <span>{error}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-[#0d1322] p-6 rounded-2xl border border-cyan-500/25">
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-blue-300 mb-1">
                {formatGram(balanceGram)}
              </div>
              <div className="text-sm text-gray-300 mb-4">
                <span className="font-bold text-white">{usdValue.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-600 mt-8">
            CyberNode Earnings Engine • earnings.ink/cybernode • Non-custodial TON staking via TonKeeper
          </div>

          <div className="flex items-center justify-center min-h-screen bg-[#050a14]/90 backdrop-blur-sm">
            <div className="bg-[#0d1322] p-8 rounded-2xl border border-cyan-500/30 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold text-cyan-400">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>

              {authError && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {authError}
                </div>
              )}

              <form
                onSubmit={authMode === 'signin' ? () => {} : () => {}}
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
        </>
      )}
    </div>
  );
}