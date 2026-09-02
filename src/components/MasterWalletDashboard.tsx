import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabaseMain } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Wallet, Zap, ArrowDownToLine, Crown } from 'lucide-react';

const MASTER_WALLET = '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

const MasterWalletDashboard: React.FC = () => {
  const [totals, setTotals] = useState({ total: 0, cinema: 0, ads: 0, telegram: 0, solana: 0 });
  const [masterCut, setMasterCut] = useState(0);
  const [isAggregating, setIsAggregating] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    aggregateProfits();
  }, []);

  const aggregateProfits = async () => {
    setIsAggregating(true);
    try {
      const { data: transactions, error } = await supabaseMain
        .from('transactions')
        .select('amount, metadata, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;

      const agg = (transactions || []).reduce(
        (acc, tx) => {
          const meta = tx.metadata || {};
          const src = meta.source || 'other';
          const amt = Number(tx.amount) || 0;
          acc[src] = (acc[src] || 0) + amt;
          acc.total = (acc.total || 0) + amt;
          return acc;
        },
        { total: 0, cinema: 0, ads: 0, telegram: 0, solana: 0, other: 0 }
      );

      setTotals(agg);
      setMasterCut(agg.total * 0.15);
    } catch (e: any) {
      toast.error('Failed to aggregate profits: ' + e.message);
    } finally {
      setIsAggregating(false);
    }
  };

  const pull12XProfit = async () => {
    setIsPulling(true);
    try {
      const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
      const response = await fetch('/api/master-wallet/aggregator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'pull-profit', userId: 'master', amount: totals.total, currency: 'USDT', source: 'master-dashboard' }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`12X Profit Pull Executed: $${result.profitAmount?.toFixed(2)} | Master cut: $${result.masterCut?.toFixed(2)}`);
        aggregateProfits();
      } else {
        toast.error(result.error || 'Profit pull failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Profit pull failed');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent flex items-center gap-3">
            <Crown className="text-yellow-400" size={36} />
            Executive Vault
          </h1>
          <p className="text-gray-400 mt-1">12X profit engine • Real-time aggregation • Solana mainnet ready</p>
        </div>
        <Button
          onClick={aggregateProfits}
          disabled={isAggregating}
          className="bg-yellow-600 hover:bg-yellow-500"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {isAggregating ? 'Aggregating...' : 'Refresh'}
        </Button>
      </div>

      {/* Master Wallet Card */}
      <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Master Treasury Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs font-mono text-yellow-200 break-all">{MASTER_WALLET}</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Total Aggregated</p>
              <p className="text-2xl font-bold text-white mt-1">${totals.total.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Cinema Earnings</p>
              <p className="text-2xl font-bold text-yellow-300 mt-1">${totals.cinema.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Ads Revenue</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">${totals.ads.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Master Cut (15%)</p>
              <p className="text-2xl font-bold text-amber-300 mt-1">${masterCut.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6">
            <Button
              onClick={pull12XProfit}
              disabled={isPulling || totals.total <= 0}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold py-3"
            >
              <ArrowDownToLine className="w-5 h-5 mr-2" />
              {isPulling ? 'Processing 12X Profit Pull...' : 'Execute 12X Profit Pull to Master Wallet'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/90 border-slate-700/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Zap className="text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Profit Multiplier</p>
                <p className="text-xl font-bold text-white">12X</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-700/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Master Cut</p>
                <p className="text-xl font-bold text-white">15%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/90 border-slate-700/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <DollarSign className="text-indigo-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">User Payout</p>
                <p className="text-xl font-bold text-white">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterWalletDashboard;
