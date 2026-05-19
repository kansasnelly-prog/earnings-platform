import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Gift, Clock, Flame, Star, Sparkles, CheckCircle, Loader2,
  Crown, Zap, TrendingUp, ChevronRight, Package, Trophy, Timer
} from 'lucide-react';

// Premium daily bonus products (rotates daily)
const DAILY_BONUS_PRODUCTS = [
  { name: 'Diamond Edition Watch', brand: 'ChronoLux', price: 149.99, category: 'Luxury', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { name: 'Platinum Wireless Pro', brand: 'AudioElite', price: 89.99, category: 'Premium Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { name: 'Royal Signature Bag', brand: 'MaisonHaus', price: 79.99, category: 'Luxury Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg' },
  { name: 'Elite Gaming Station', brand: 'ProForge', price: 129.99, category: 'Premium Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg' },
  { name: 'Obsidian Phone Ultra', brand: 'NexGen', price: 299.99, category: 'Flagship', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { name: 'Prestige Oud Parfum', brand: 'MaisonNoir', price: 59.99, category: 'Premium Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { name: 'Velocity Max Runners', brand: 'EliteSport', price: 99.99, category: 'Premium Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg' },
];

// Helper function to get base reward based on account type and VIP level
const getBaseDailyReward = (user: any): number => {
  // VIP1 (personal) accounts get $8.50
  // VIP2 and training accounts get $12.50
  if (user?.account_type === 'personal' && user?.vip_level === 1) {
    return 8.50;
  }
  return 12.50;
};

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayKey(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

interface DailyBonusState {
  lastClaimedDate: string | null;
  streak: number;
  totalBonusClaimed: number;
}

function loadDailyBonusState(userId: string): DailyBonusState {
  try {
    const saved = localStorage.getItem(`opt_daily_bonus_${userId}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { lastClaimedDate: null, streak: 0, totalBonusClaimed: 0 };
}

function saveDailyBonusState(userId: string, state: DailyBonusState) {
  localStorage.setItem(`opt_daily_bonus_${userId}`, JSON.stringify(state));
}

// Countdown timer display
const CountdownTimer: React.FC<{ time: { hours: number; minutes: number; seconds: number } }> = ({ time }) => (
  <div className="flex items-center gap-1.5">
    {[
      { value: time.hours, label: 'H' },
      { value: time.minutes, label: 'M' },
      { value: time.seconds, label: 'S' },
    ].map((unit, i) => (
      <React.Fragment key={unit.label}>
        {i > 0 && <span className="text-indigo-400/50 font-bold text-lg">:</span>}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-black/40 border border-indigo-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-xl font-bold text-white font-mono tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[9px] text-gray-500 mt-1 font-medium">{unit.label}</span>
        </div>
      </React.Fragment>
    ))}
  </div>
);

// Streak flame display
const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => {
  if (streak <= 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
      <Flame size={14} className="text-orange-400" />
      <span className="text-xs font-bold text-orange-300">{streak} Day Streak</span>
    </div>
  );
};

// Animated reward multiplier badge
const MultiplierBadge: React.FC = () => (
  <div className="relative inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-shimmer" />
    <Sparkles size={12} className="text-amber-400 relative z-10" />
    <span className="text-xs font-bold text-amber-300 relative z-10">2X REWARD</span>
  </div>
);

// Circular progress ring for the bonus card
const BonusProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 80 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#bonusGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="bonusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ===== MAIN DAILY BONUS COMPONENT =====
const DailyBonus: React.FC = () => {
  const { user } = useAppContext();
  const [bonusState, setBonusState] = useState<DailyBonusState>({ lastClaimedDate: null, streak: 0, totalBonusClaimed: 0 });
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [phase, setPhase] = useState<'idle' | 'preload' | 'reveal' | 'claiming' | 'success'>('idle');
  const [imageLoaded, setImageLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const isClaimed = bonusState.lastClaimedDate === todayKey;
  const dayIndex = getDayOfYear() % DAILY_BONUS_PRODUCTS.length;
  const dailyProduct = DAILY_BONUS_PRODUCTS[dayIndex];

  // Calculate streak-based reward: base + streak bonus (dynamic based on account type)
  const baseDailyReward = getBaseDailyReward(user);
  const streakMultiplier = Math.min(bonusState.streak, 7); // max 7-day bonus
  const dailyReward = baseDailyReward + (streakMultiplier * 0.50); // +$0.50 per streak day

  // Load state
  useEffect(() => {
    if (user) {
      const state = loadDailyBonusState(user.id);
      // Check if streak is still valid (claimed yesterday or today)
      if (state.lastClaimedDate !== todayKey && state.lastClaimedDate !== yesterdayKey) {
        state.streak = 0; // Reset streak if missed a day
      }
      setBonusState(state);
    }
  }, [user, todayKey, yesterdayKey]);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleClaim = useCallback(async () => {
    if (!user || isClaimed || phase !== 'idle') return;

    setPhase('preload');

    // Simulate preload animation
    setTimeout(() => {
      setPhase('reveal');
    }, 1500);
  }, [user, isClaimed, phase]);

  const handleSubmitReview = useCallback(async () => {
    if (!user || phase !== 'reveal') return;
    setPhase('claiming');

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Update bonus state
    const wasStreakActive = bonusState.lastClaimedDate === yesterdayKey || bonusState.lastClaimedDate === todayKey;
    const newStreak = wasStreakActive ? bonusState.streak + 1 : 1;
    const newState: DailyBonusState = {
      lastClaimedDate: todayKey,
      streak: newStreak,
      totalBonusClaimed: bonusState.totalBonusClaimed + dailyReward,
    };

    setBonusState(newState);
    saveDailyBonusState(user.id, newState);

    // Update user balance in Supabase (primary source for dashboard)
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('users')
        .update({
          balance: (user.balance || 0) + dailyReward,
          total_earned: (user.total_earned || 0) + dailyReward
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Failed to update balance in Supabase:', error);
        // Fallback to localStorage if Supabase fails
        const savedUser = localStorage.getItem('opt_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          u.balance = (u.balance || 0) + dailyReward;
          u.total_earned = (u.total_earned || 0) + dailyReward;
          localStorage.setItem('opt_user', JSON.stringify(u));
        }
      }
      // Force a page-level state refresh
      window.dispatchEvent(new Event('daily-bonus-claimed'));
    } catch (error) {
      console.error('Error updating balance:', error);
    }

    setPhase('success');

    // Reset after celebration
    setTimeout(() => {
      setPhase('idle');
      // Reload to sync balance
      window.location.reload();
    }, 3000);
  }, [user, phase, bonusState, dailyReward, todayKey, yesterdayKey]);

  if (!user) return null;

  // ===== CLAIMED STATE - Show countdown to next bonus =====
  if (isClaimed && phase === 'idle') {
    return (
      <div className="relative p-6 bg-gradient-to-br from-emerald-500/5 via-white/[0.02] to-indigo-500/5 border border-emerald-500/15 rounded-2xl overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px]" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">Daily Bonus Claimed!</h3>
                <MultiplierBadge />
              </div>
              <p className="text-sm text-gray-400 mb-2">
                You earned <span className="text-emerald-400 font-bold">${dailyReward.toFixed(2)}</span> from today's premium review
              </p>
              <div className="flex items-center gap-3">
                <StreakBadge streak={bonusState.streak} />
                <span className="text-xs text-gray-500">
                  Total bonus: <span className="text-indigo-400 font-semibold">${bonusState.totalBonusClaimed.toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500 font-medium">Next bonus in</p>
            <CountdownTimer time={countdown} />
          </div>
        </div>
      </div>
    );
  }

  // ===== SUCCESS STATE =====
  if (phase === 'success') {
    return (
      <div className="relative p-8 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-amber-500/10 border border-emerald-500/20 rounded-2xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
          {/* Success ring */}
          <div className="relative w-28 h-28 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" style={{ animationDuration: '1s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center animate-scale-bounce">
                <Trophy size={40} className="text-amber-400" />
              </div>
            </div>
            {/* Confetti */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  background: ['#818cf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#4ade80'][i],
                  top: '50%', left: '50%',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          <h3 className="text-2xl font-bold text-white mb-2 animate-slide-up">Daily Bonus Complete!</h3>
          <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-lg font-bold text-emerald-400">+${dailyReward.toFixed(2)}</span>
              <span className="text-xs text-emerald-400/60 font-medium">(2X)</span>
            </div>
          </div>
          {bonusState.streak > 0 && (
            <div className="mt-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <StreakBadge streak={bonusState.streak} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== PRELOAD STATE =====
  if (phase === 'preload') {
    return (
      <div className="relative p-8 bg-gradient-to-br from-indigo-500/5 via-white/[0.02] to-purple-500/5 border border-indigo-500/15 rounded-2xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-8">
          {/* Animated loading rings */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/30 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.2s' }} />
            <div className="absolute inset-4 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 via-indigo-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm">
                <Gift size={24} className="text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-400 mb-3">Preparing your premium product...</p>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  // ===== REVEAL / ACTIVE STATE - Show product for review =====
  if (phase === 'reveal') {
    return (
      <div className="relative bg-gradient-to-br from-amber-500/5 via-white/[0.02] to-indigo-500/5 border border-amber-500/15 rounded-2xl overflow-hidden">
        {/* Premium glow effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/8 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/8 rounded-full blur-[80px]" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Crown size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Daily Bonus Review
                <MultiplierBadge />
              </h3>
              <p className="text-xs text-gray-500">Premium product — higher reward</p>
            </div>
          </div>
          <StreakBadge streak={bonusState.streak} />
        </div>

        {/* Product showcase */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative p-6 md:p-8 flex items-center justify-center min-h-[280px] md:min-h-[350px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400/40 rounded-full animate-float-slow" />
              <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-float-medium" />
            </div>

            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-indigo-500/10 rounded-2xl blur-xl" />
              <img
                src={dailyProduct.image}
                alt={dailyProduct.name}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-once" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer-once" />
              </div>
            </div>

            {/* Category badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full animate-slide-up">
              <span className="text-xs font-semibold text-amber-300">{dailyProduct.category}</span>
            </div>

            {/* Daily bonus badge */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/30 rounded-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Gift size={11} /> DAILY BONUS
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="animate-slide-up">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">{dailyProduct.brand}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">{dailyProduct.name}</h2>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-gray-400">5.0 (Premium)</span>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-white">${dailyProduct.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500 line-through">${(dailyProduct.price * 1.4).toFixed(2)}</span>
              </div>
            </div>

            {/* Reward info - enhanced */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-xl mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">Daily Bonus Reward</span>
                </div>
                <span className="text-xl font-bold text-emerald-400">+${dailyReward.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Zap size={12} className="text-amber-400" />
                <span>2X multiplier applied — Premium product review</span>
              </div>
              {bonusState.streak > 0 && (
                <div className="flex items-center gap-2 text-xs text-orange-400 mt-1">
                  <Flame size={12} />
                  <span>+${(streakMultiplier * 0.50).toFixed(2)} streak bonus ({bonusState.streak} day streak)</span>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmitReview}
              disabled={phase === 'claiming'}
              className="w-full py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] group animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              {phase === 'claiming' ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Processing Bonus Review...</span>
                </>
              ) : (
                <>
                  <Crown size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Submit Premium Review</span>
                  <span className="ml-2 px-3 py-1 bg-white/15 rounded-full text-sm">+${dailyReward.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== DEFAULT IDLE STATE - Show the Daily Bonus card =====
  return (
    <div className="relative group">
      <button
        onClick={handleClaim}
        className="w-full text-left relative p-6 bg-gradient-to-br from-amber-500/5 via-white/[0.02] to-indigo-500/5 border border-amber-500/15 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-amber-500/5"
      >
        {/* Animated background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/10 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] group-hover:bg-indigo-500/10 transition-all duration-700" />

        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent animate-shimmer" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Animated gift icon */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Gift size={28} className="text-amber-400" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              {/* 2X badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-[9px] font-black text-white">2X</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-white">Daily Bonus Available!</h3>
                <MultiplierBadge />
              </div>
              <p className="text-sm text-gray-400 mb-2">
                Review a premium product for <span className="text-amber-400 font-bold">${dailyReward.toFixed(2)}</span> reward
              </p>
              <div className="flex items-center gap-3">
                <StreakBadge streak={bonusState.streak} />
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Timer size={12} />
                  <span>Resets at midnight</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {/* Countdown */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Expires in</p>
              <CountdownTimer time={countdown} />
            </div>

            {/* Claim button hint */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl group-hover:bg-amber-500/20 transition-all">
              <span className="text-sm font-bold text-amber-300">Claim Now</span>
              <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

// ===== COMPACT DAILY BONUS CARD (for Dashboard) =====
export const DailyBonusCompact: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { user } = useAppContext();
  const [bonusState, setBonusState] = useState<DailyBonusState>({ lastClaimedDate: null, streak: 0, totalBonusClaimed: 0 });
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const isClaimed = bonusState.lastClaimedDate === todayKey;
  const streakMultiplier = Math.min(bonusState.streak, 7);
  const dailyReward = getBaseDailyReward(user) + (streakMultiplier * 0.50);

  useEffect(() => {
    if (user) {
      const state = loadDailyBonusState(user.id);
      if (state.lastClaimedDate !== todayKey && state.lastClaimedDate !== yesterdayKey) {
        state.streak = 0;
      }
      setBonusState(state);
    }
  }, [user, todayKey, yesterdayKey]);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <button
      onClick={() => onNavigate?.()}
      className={`w-full p-5 border rounded-2xl text-left transition-all group ${
        isClaimed
          ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
          : 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
          isClaimed ? 'bg-emerald-500/20' : 'bg-amber-500/20'
        }`}>
          {isClaimed ? (
            <CheckCircle size={18} className="text-emerald-400" />
          ) : (
            <Gift size={18} className="text-amber-400" />
          )}
          {!isClaimed && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-[7px] font-black text-white">2X</span>
            </div>
          )}
        </div>
        {isClaimed ? (
          <CheckCircle size={14} className="text-emerald-400 ml-auto" />
        ) : (
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>

      <h4 className="text-sm font-bold text-white mb-0.5">
        {isClaimed ? 'Bonus Claimed' : 'Daily Bonus'}
      </h4>
      <p className="text-xs text-gray-500">
        {isClaimed ? (
          <>Next in {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</>
        ) : (
          <>Earn <span className="text-amber-400 font-semibold">${dailyReward.toFixed(2)}</span> — 2X reward</>
        )}
      </p>
      {bonusState.streak > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <Flame size={10} className="text-orange-400" />
          <span className="text-[10px] font-bold text-orange-300">{bonusState.streak} day streak</span>
        </div>
      )}
    </button>
  );
};

export default DailyBonus;
