import React, { useState, useEffect } from 'react';
import { supabaseMain } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Zap, Star, Wallet, TrendingUp, Play, Gift, Shield, Coins, Film, MessageSquare, Share2, Heart, ShoppingCart, BarChart3, Landmark, Bot, Crown } from 'lucide-react';
import AdsgramRewardedVideo from './AdsgramRewardedVideo';
import EarningsAnnouncement from './EarningsAnnouncement';

interface Strategy {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  reward_type: string;
  base_reward: number;
  reward_currency: string;
  is_active: boolean;
  requires_telegram: boolean;
  requires_wallet: boolean;
  cooldown_seconds: number;
}

interface UserEarning {
  id: string;
  strategy_id: string;
  status: string;
  reward_amount: number;
  reward_currency: string;
  created_at: string;
  completed_at?: string;
}

const STRATEGY_ICONS: Record<string, React.ElementType> = {
  'watch-to-earn': Play,
  'telegram-stars': Star,
  'ton-deposit-bonus': Wallet,
  'solana-staking': TrendingUp,
  'adsgram-rewarded-video': Play,
  'referral-commission': Gift,
  'daily-checkin': Shield,
  'task-completion': Coins,
  'training-account-bonus': Crown,
  'vip-level-bonus': Crown,
  'executive-vault-yield': Landmark,
  'cinema-stream-reward': Film,
  'ai-chat-engagement': MessageSquare,
  'social-share-bonus': Share2,
  'matchmaking-reward': Heart,
  'product-catalog-commission': ShoppingCart,
  'ad-impression-revenue': BarChart3,
  'multi-chain-yield': Wallet,
  'mini-app-engagement': Bot,
  'executive-membership': Crown,
};

const MonetizationHub: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [earnings, setEarnings] = useState<UserEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [totalEarned, setTotalEarned] = useState({ usdt: 0, stars: 0, ton: 0, sol: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [strategiesRes, earningsRes] = await Promise.all([
        supabaseMain.from('earning_strategies').select('*').eq('is_active', true).order('category'),
        supabaseMain.from('user_earnings').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (strategiesRes.error) throw strategiesRes.error;
      if (earningsRes.error) throw earningsRes.error;

      setStrategies(strategiesRes.data || []);
      setEarnings(earningsRes.data || []);

      const totals = (earningsRes.data || []).reduce(
        (acc, e) => {
          const currency = (e.reward_currency || 'USDT').toLowerCase();
          if (currency === 'usdt' || currency === 'usdc') acc.usdt += Number(e.reward_amount) || 0;
          else if (currency === 'stars' || currency === 'xtr') acc.stars += Number(e.reward_amount) || 0;
          else if (currency === 'ton') acc.ton += Number(e.reward_amount) || 0;
          else if (currency === 'sol') acc.sol += Number(e.reward_amount) || 0;
          return acc;
        },
        { usdt: 0, stars: 0, ton: 0, sol: 0 }
      );
      setTotalEarned(totals);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load monetization hub');
    } finally {
      setLoading(false);
    }
  };

  const executeStrategy = async (strategy: Strategy) => {
    try {
      toast.info(`Starting ${strategy.name}...`);
      
      const { data: { user } } = await supabaseMain.auth.getUser();
      if (!user) {
        toast.error('Please log in to execute strategies');
        return;
      }

      const response = await fetch('/api/earnings/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategySlug: strategy.slug,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${strategy.name}: ${result.message || 'Reward processed'}`);
        loadData();
      } else {
        toast.error(result.message || 'Strategy execution failed');
      }

      if (strategy.slug === 'adsgram-rewarded-video') {
        await fetch(`https://earnings-ink.vercel.app/api/webhooks/adsgram?userid=${encodeURIComponent(user.id)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to execute strategy');
    }
  };

  const categories = ['all', 'ads', 'task', 'social', 'defi', 'referral', 'streaming', 'ai', 'mini-app', 'bonus'];

  const filteredStrategies = activeCategory === 'all' 
    ? strategies 
    : strategies.filter(s => s.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <EarningsAnnouncement />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="text-yellow-400" size={32} />
            Monetization Hub
          </h1>
          <p className="text-gray-400 mt-1">20 active earning strategies across ads, DeFi, tasks, and social.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="USDT Earned" value={`$${totalEarned.usdt.toFixed(2)}`} icon={Wallet} />
        <StatCard label="Stars Earned" value={totalEarned.stars.toLocaleString()} icon={Star} />
        <StatCard label="TON Earned" value={`${totalEarned.ton.toFixed(2)} TON`} icon={Wallet} />
        <StatCard label="SOL Earned" value={`${totalEarned.sol.toFixed(4)} SOL`} icon={TrendingUp} />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStrategies.map(strategy => {
          const Icon = STRATEGY_ICONS[strategy.slug] || Zap;
          const isActive = strategy.is_active;
          return (
            <div
              key={strategy.id}
              className={`rounded-2xl border p-5 transition-all ${
                isActive
                  ? 'bg-slate-900/90 border-slate-700/50 hover:border-indigo-500/50'
                  : 'bg-slate-900/40 border-slate-800/50 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-gray-500/10 border border-gray-500/20'
                }`}>
                  <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-gray-500'} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{strategy.name}</h3>
                  <span className="text-xs text-gray-400">{strategy.category}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">{strategy.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-1 rounded">
                  {strategy.base_reward} {strategy.reward_currency}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                onClick={() => executeStrategy(strategy)}
                disabled={!isActive}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isActive ? 'Execute' : 'Unavailable'}
              </button>
            </div>
          );
        })}
      </div>

      {earnings.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Earnings</h2>
          <div className="space-y-2">
            {earnings.slice(0, 10).map(earning => (
              <div key={earning.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">Strategy #{earning.strategy_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{new Date(earning.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-400">+{earning.reward_amount} {earning.reward_currency}</p>
                  <p className="text-xs text-gray-400">{earning.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="adsgram-rewarded-video-section" className="max-w-7xl mx-auto">
        <AdsgramRewardedVideo />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
        <Icon size={20} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default MonetizationHub;
