import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const cybernodeSupabase = createClient(
  import.meta.env.VITE_CYBERNODE_SUPABASE_URL || '',
  import.meta.env.VITE_CYBERNODE_SUPABASE_ANON_KEY || ''
);
import {
  Loader2,
  Wallet,
  Activity,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const CLAIM_SECTIONS = [
  { id: 'grass_edge', name: 'Grass Network Edge', icon: '🌿', color: 'text-emerald-400' },
  { id: 'nodepay', name: 'NodePay / Oasis AI', icon: '🤖', color: 'text-violet-400' },
  { id: 'honeygain', name: 'Honeygain Headless', icon: '🍯', color: 'text-amber-400' },
  { id: 'gaganode', name: 'GaGaNode Meson', icon: '🔵', color: 'text-blue-400' },
  { id: 'earnapp', name: 'EarnApp Daemon', icon: '📱', color: 'text-rose-400' },
];

const GRAM_USD_RATE = 1.35;
const MIN_WITHDRAWAL = 2.00;
const GAS_FEE = 0.002;

function formatGram(val: number): string {
  return Number(val).toFixed(6);
}

export default function CyberNodeDashboard() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balanceGram, setBalanceGram] = useState(0);
  const [miningSpeed, setMiningSpeed] = useState(0.051);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [claims, setClaims] = useState<Record<string, { unclaimed_amount: number; last_claimed_at: string }>>({});
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [lastMinedAt, setLastMinedAt] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tickInterval, setTickInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  /* ================= Supabase Email/Password Auth ================= */
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tonConnectUI = new (window as any).TonConnectUI({
      manifestUrl: 'https://earnings.ink/tonconnect-manifest.json',
      buttonRootId: 'ton-connect-button',
    });

    tonConnectUI.onStatusChange((wallet: any) => {
      if (wallet) {
        setWalletConnected(true);
        setWalletAddress(wallet.account.address);
        void loadUserData(wallet.account.address);
        void startMiningTick(wallet.account.address);
        void syncUserWithSupabase(wallet.account.address);
      } else {
        setWalletConnected(false);
        setWalletAddress('');
        if (tickInterval) clearInterval(tickInterval);
        setTickInterval(null);
      }
    });

    return () => {
      tonConnectUI.disconnect?.();
      if (tickInterval) clearInterval(tickInterval);
    };
  }, []);

  const loadUserData = useCallback(async (address: string) => {
    try {
      const res = await fetch(`/api/cybernode/user?wallet_address=${encodeURIComponent(address)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.user) {
        setBalanceGram(Number(data.user.balance_gram) || 0);
        setMiningSpeed(Number(data.user.mining_speed) || 0.051);
        setDailyStreak(data.user.daily_streak || 0);
        setLastMinedAt(data.user.last_mined_at);
        setLastCheckIn(data.user.last_check_in || null);
      }
      if (data.claims) {
        const claimsMap: Record<string, any> = {};
        data.claims.forEach((c: any) => {
          claimsMap[c.section_type] = c;
        });
        setClaims(claimsMap);
      }
    } catch (e) {
      console.error('[CyberNode] loadUserData error:', e);
    }
  }, []);

  const startMiningTick = useCallback(async (address: string) => {
    if (tickInterval) clearInterval(tickInterval);

    const tick = async () => {
      try {
        const res = await fetch('/api/cybernode/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: address }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setBalanceGram(data.balance_gram);
          }
        }
      } catch (e) {
        console.error('[CyberNode] tick error:', e);
      }
    };

    tick();
    const interval = setInterval(tick, 5000);
    setTickInterval(interval);
  }, [tickInterval]);

  const handleConnect = async () => {
    if (typeof window === 'undefined' || !(window as any).TonConnectUI) {
      setError('TonConnect UI not loaded. Please refresh.');
      return;
    }
    const tonConnectUI = new (window as any).TonConnectUI({
      manifestUrl: 'https://earnings.ink/tonconnect-manifest.json',
      buttonRootId: 'ton-connect-button',
    });
    try {
      await tonConnectUI.openModal();
    } catch (e) {
      setError('Failed to open wallet connector.');
    }
  };

  const handleWithdraw = async () => {
    if (!walletAddress) return;
    if (balanceGram < MIN_WITHDRAWAL) {
      setError(`🔒 Minimum withdrawal is $${MIN_WITHDRAWAL} GRAM. Current: ${formatGram(balanceGram)} GRAM.`);
      return;
    }
    setIsWithdrawing(true);
    setError(null);
    try {
      const res = await fetch('/api/cybernode/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        setBalanceGram(0);
        setTxHash(data.tx_hash);
        void loadUserData(walletAddress);
      } else {
        setError(data.error || 'Withdrawal failed');
      }
    } catch (e) {
      setError('Network error during withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleClaim = async (sectionId: string) => {
    if (!walletAddress) return;
    setError(null);
    try {
      const res = await fetch('/api/cybernode/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address, section_type: sectionId, claim_amount: 0.002 }),
      });
      const data = await res.json();
      if (data.success) {
        void loadUserData(walletAddress);
      } else {
        setError(data.error || 'Claim failed');
      }
    } catch (e) {
      setError('Claim request failed');
    }
  };

  const handleCheckIn = async () => {
    if (!walletAddress) return;
    if (lastCheckIn) {
      const today = new Date().toDateString();
      const last = new Date(lastCheckIn).toDateString();
      if (today === last) {
        setError('Already checked in today.');
        return;
      }
    }
    setError(null);
    try {
      const res = await fetch('/api/cybernode/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        setBalanceGram(data.new_balance);
        setDailyStreak(data.streak);
        setLastCheckIn(new Date().toISOString());
      } else {
        setError(data.error || 'Check-in failed');
      }
    } catch (e) {
      setError('Check-in request failed');
    }
  };

  const handleReferral = async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch('/api/cybernode/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_wallet: walletAddress, referrer_code: walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        void loadUserData(walletAddress);
      }
    } catch (e) {
      setError('Referral registration failed');
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/cybernode?ref=${walletAddress}`;
    navigator.clipboard.writeText(link);
    setError('Referral link copied to clipboard!');
    setTimeout(() => setError(null), 3000);
  };

  /* ================= Supabase Auth Functions ================= */
  useEffect(() => {
    const { data: { subscription } } = cybernodeSupabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setAuthLoading(false);
        setWalletConnected(false);
        setWalletAddress('');
        setBalanceGram(0);
        setTxHash(null);
      } else {
        setAuthLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') || '').toString();
    const password = (formData.get('password') || '').toString();
    setAuthError(null);
    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }
    try {
      const { error } = await cybernodeSupabase.auth.signUp({ email, password });
      if (error) throw error;
      setAuthMode('signin');
      setAuthError('Account created! Please sign in.');
    } catch (err: any) {
      setAuthError(err.message || 'Sign up failed');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') || '').toString();
    const password = (formData.get('password') || '').toString();
    setAuthError(null);
    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }
    try {
      const { error } = await cybernodeSupabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    await cybernodeSupabase.auth.signOut();
    setWalletConnected(false);
    setWalletAddress('');
    setBalanceGram(0);
    setTxHash(null);
  };

  const syncUserWithSupabase = async (address: string) => {
    if (!authUser) return;
    try {
      const { data: existing } = await cybernodeSupabase
        .from('cybernode_users')
        .select('*')
        .eq('wallet_address', address)
        .single();
      if (!existing) {
        await cybernodeSupabase.from('cybernode_users').insert({
          wallet_address: address,
          balance_gram: 0,
          mining_speed: 0.051,
          last_mined_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('[CyberNode] sync error:', e);
    }
  };

  const usdValue = balanceGram * GRAM_USD_RATE;
  const progressToWithdraw = Math.min((balanceGram / MIN_WITHDRAWAL) * 100, 100);

  const isAlreadyCheckedIn =
    lastCheckIn ? new Date().toDateString() === new Date(lastCheckIn).toDateString() : false;
  const checkInButtonClass = isAlreadyCheckedIn
    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
    : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 cursor-pointer';
  const checkInButtonLabel = isAlreadyCheckedIn ? '✓ Checked In' : '✓ Daily Check-in';

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
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">
              Cloud Mining Core • TON Staking • TonKeeper Payouts
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-end">
          <div id="ton-connect-button" className="w-full md:w-auto" />
          <span className={`text-[11px] px-3 py-1.5 rounded-md font-bold ${
            walletConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {walletConnected ? `Linked ✓ ${walletAddress.slice(0, 6)}...` : 'Not Connected'}
          </span>
          {authUser && (
            <button
              onClick={handleSignOut}
              className="text-[11px] px-3 py-1.5 rounded-md border border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition"
            >
              Sign Out
            </button>
          )}
          {!walletConnected && !authUser && (
            <button
              onClick={handleConnect}
              className="text-[11px] px-3 py-1.5 rounded-md border border-cyan-500/40 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 transition"
            >
              Connect TonKeeper
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono flex items-center gap-3">
          <ShieldCheck size={16} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

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

          <div>
            <button
              onClick={handleWithdraw}
              disabled={!walletConnected || balanceGram < MIN_WITHDRAWAL || isWithdrawing}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wider transition shadow-lg disabled:opacity-50 ${
                balanceGram >= MIN_WITHDRAWAL && walletConnected
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {isWithdrawing ? (
                <>
                  <Loader2 size={18} strokeWidth={2.5} className="-ml-1 mr-2 animate-spin" />
                  BROADCASTING...
                </>
              ) : balanceGram >= MIN_WITHDRAWAL ? (
                <>
                  <ArrowRight size={18} strokeWidth={2.5} className="mr-2" />
                  ⚡ WITHDRAW TO TONKEEPER ↗
                </>
              ) : (
                `🔒 LOCKED (${formatGram(balanceGram)} / $${MIN_WITHDRAWAL} GRAM)`
              )}
            </button>
            <div className="text-[10px] text-center text-gray-500 mt-3 space-y-1">
              <div>Gas Fee: ~{GAS_FEE} GRAM (Network Standard)</div>
              <div>Min Threshold: $${MIN_WITHDRAWAL} GRAM</div>
              {txHash && <div className="text-green-400 text-xs font-bold">TX: {txHash.slice(0, 14)}...</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0d1322] p-6 rounded-2xl border border-cyan-500/25 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-cyan-400">Concurrent Node Daemons</h3>
            <p className="text-[11px] text-gray-400">5 Instant Claim Sections</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckIn}
              disabled={isAlreadyCheckedIn}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${checkInButtonClass}`}
            >
              {checkInButtonLabel}
              <span className="ml-1 text-green-400">+{formatGram(0.01 + dailyStreak * 0.005)} GRAM</span>
              <span className="text-gray-500 ml-1">• {dailyStreak} Day Streak</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CLAIM_SECTIONS.map((section) => {
            const claim = claims[section.id];
            return (
              <div key={section.id} className="bg-[#111827] p-4 rounded-xl border border-gray-800/50 flex flex-col justify-between group hover:border-cyan-500/30 transition">
                <div>
                  <div className="text-2xl mb-2">{section.icon}</div>
                  <div className="text-xs font-bold {section.color} mb-1">● Running</div>
                  <div className="text-[11px] font-semibold mb-2 leading-tight">{section.name}</div>
                  <div className="text-[10px] text-gray-500 mb-3">Projected: +$2.50/day</div>
                </div>
                <button
                  onClick={() => handleClaim(section.id)}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 py-2 rounded-lg text-[10px] font-bold transition all"
                >
                  Instant Claim (+0.002 GRAM)
                </button>
                {claim && (
                  <div className="mt-2 text-[10px] text-gray-500 text-center">
                    Last: {new Date(claim.last_claimed_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-6 rounded-2xl border border-cyan-500/25 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Zap size={18} strokeWidth={2} className="text-cyan-400" />
          Referral Program — 0.30–0.50 GRAM per referral
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111827] p-4 rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-400 uppercase mb-2">Your Referral Code</div>
            <div className="flex gap-2 items-center mb-3">
              <input
                type="text"
                value={walletAddress}
                readOnly
                className="flex-1 bg-[#050a14] border border-gray-700 rounded px-3 py-2 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={copyReferralLink}
                className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-bold transition"
              >
                Copy
              </button>
            </div>
            <div className="text-[11px] text-gray-400">Share: {walletAddress ? `${window.location.origin}/cybernode?ref=${walletAddress}` : 'Connect wallet to generate'}</div>
          </div>
          <div className="bg-[#111827] p-4 rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-400 uppercase mb-2">Reward Per Referral</div>
            <div className="text-2xl font-bold text-green-400 mb-2">0.30 – 0.50 GRAM</div>
            <div className="text-[11px] text-gray-400 mb-4">Instantly credited to referrer balance on signup.</div>
            <button
              onClick={handleReferral}
              className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-lg text-[10px] font-bold transition"
            >
              Register Referral
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-600 mt-8">
        CyberNode Earnings Engine • earnings.ink/cybernode • Non-custodial TON staking via TonKeeper
      </div>
      ) : (
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
      )}
    </div>
  );
}