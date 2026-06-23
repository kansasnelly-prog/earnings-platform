import React, { useEffect, useState, FC, createContext, useContext } from 'react';
import { useSafeAuth } from '../contexts/SafeAuthProvider';
import { supabase } from '../lib/supabase';
import { logCore, logSupabase, logNellyCoin } from '../utils/logger';
import AdminUsers from '../components/admin/AdminUsers.tsx';
import AdminCustomerService from '../components/admin/AdminCustomerService.tsx';
import ProductCatalogManager from '../components/admin/ProductCatalogManager.tsx';
import MainAdminPanel from '../components/admin/MainAdminPanel';
import TikTok6AdminMatch from '../components/admin/TikTok6AdminMatch';
// Tabs UI component for modular navigation
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ===========================================
// NELLYCOIN STATE LEDGER ENGINE
// ===========================================

interface NellyCoinState {
  totalCoins: number;
  userCoins: number;
  pendingPayouts: number;
  transactions: Array<{
    id: string;
    userId: string;
    amount: number;
    type: 'task_reward' | 'conversion' | 'payout';
    timestamp: string;
  }>;
}

interface NellyCoinContextType {
  nellyCoinState: NellyCoinState;
  awardCoins: (userId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  refreshNellyCoinState: () => Promise<void>;
}

const NellyCoinContext = createContext<NellyCoinContextType | undefined>(undefined);

export const useNellyCoin = () => {
  const context = useContext(NellyCoinContext);
  if (!context) {
    throw new Error('useNellyCoin must be used within NellyCoinProvider');
  }
  return context;
};


/**
 * AIAssistantWorkspace – renders the premium 3D admin panels after authentication.
 * It also performs a non‑blocking health‑check against the local Llama 3 engine.
 */
const AIAssistantWorkspace: FC = () => {
  const { user, loading, logout } = useSafeAuth();
  const [aiStatus, setAiStatus] = useState<string>('Checking AI service…');
  const [nellyCoinState, setNellyCoinState] = useState<NellyCoinState>({
    totalCoins: 0,
    userCoins: 0,
    pendingPayouts: 0,
    transactions: []
  });
  // Active tab for department navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'optimization' | 'support' | 'tiktok6'>('overview');

  // ===========================================
  // NELLYCOIN STATE INITIALIZATION
  // ===========================================
  useEffect(() => {
    const initializeNellyCoinLedger = async () => {
      try {
        logCore('Initializing NellyCoin State Ledger...');
        
        // Fetch total NellyCoins across all users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, balance, total_earned');

        if (usersError) {
          logSupabase('Error fetching users for NellyCoin ledger', usersError);
          return;
        }

        const totalCoins = (usersData || []).reduce((sum, u) => sum + (u.total_earned || 0), 0);
        
        // Fetch pending payouts
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('amount, status')
          .eq('status', 'pending');

        if (withdrawalsError) {
          logSupabase('Error fetching pending payouts', withdrawalsError);
          return;
        }

        const pendingPayouts = (withdrawalsData || []).reduce((sum, w) => sum + (w.amount || 0), 0);

        setNellyCoinState({
          totalCoins,
          userCoins: user ? (usersData?.find(u => u.id === user.id)?.total_earned || 0) : 0,
          pendingPayouts,
          transactions: []
        });

        logNellyCoin('NellyCoin Ledger initialized', { totalCoins, pendingPayouts });
      } catch (error) {
        logCore('NellyCoin initialization error', error);
      }
    };

    initializeNellyCoinLedger();
  }, [user]);

  // ===========================================
  // TASK COMPLETION INTERCEPTOR - AWARD NELLYCOINS
  // ===========================================
  const completeTaskAndAwardCoins = async (userId: string, taskNumber: number) => {
    try {
      logNellyCoin(`Awarding 10 NellyCoins for task #${taskNumber}`, { userId });

      // Fetch current user values
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('total_earned, balance')
        .eq('id', userId)
        .single();

      if (fetchError || !userData) {
        logSupabase('Error fetching user data for NellyCoin award', fetchError);
        return { success: false, error: fetchError?.message || 'User not found' };
      }

      // Award 10 NellyCoins (stored as dollar equivalent in total_earned)
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          total_earned: (userData.total_earned || 0) + 10,
          balance: (userData.balance || 0) + 10
        })
        .eq('id', userId);

      if (updateError) {
        logSupabase('Error awarding NellyCoins', updateError);
        return { success: false, error: updateError.message };
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'task_reward',
          amount: 10,
          description: `NellyCoin reward for task #${taskNumber}`,
          status: 'completed'
        });

      if (transactionError) {
        logSupabase('Error recording NellyCoin transaction', transactionError);
      }

      // Refresh local state
      setNellyCoinState(prev => ({
        ...prev,
        totalCoins: prev.totalCoins + 10,
        userCoins: prev.userCoins + 10
      }));

      logNellyCoin(`Successfully awarded 10 NellyCoins`, { userId, taskNumber });
      return { success: true };
    } catch (error) {
      logCore('Exception in completeTaskAndAwardCoins', error);
      return { success: false, error: 'Failed to award NellyCoins' };
    }
  };

  // Async safety check for local Llama 3 engine
  useEffect(() => {
    const checkAI = async () => {
      try {
        logCore('Checking AI service health...');
        // Attempt health check with CORS-friendly mode; suppress errors from console
        const response = await fetch('http://localhost:11434/', { mode: 'no-cors' });
        // When using no-cors, the response is opaque; we cannot read JSON, so just assume success if no network error
        if (response && (response as any).type === 'opaque') {
          setAiStatus('AI service OK (no‑cors)');
          logCore('AI service status: OK (no-cors mode)');
        } else if (response && response.ok) {
          const data = await response.json();
          setAiStatus(data.status ?? 'AI service OK');
          logCore('AI service status:', data.status);
        } else {
          throw new Error('AI service responded with error');
        }
      } catch (err) {
        // Gracefully handle failure – do not block UI
        logCore('Llama 3 health check failed', err);
        setAiStatus('AI service unavailable');
      }
    };
    // fire‑and‑forget, no await needed for UI rendering
    checkAI();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Loading authentication…</div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Access denied. Please log in.</div>;
  }
  // Gatekeeper: only allow the specific admin email
  if (user.email !== 'kansasnelly@gmail.com') {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Access denied. Unauthorized user.</div>;
  }

  return (
    <NellyCoinContext.Provider value={{
      nellyCoinState,
      awardCoins: completeTaskAndAwardCoins,
      refreshNellyCoinState: async () => {}
    }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 backdrop-blur-xl space-y-8 p-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">Admin Workspace</h1>
        <p className="text-sm text-slate-400">AI Service Status: {aiStatus}</p>
        
        {/* NELLYCOIN ECONOMY MANAGER - Premium 3D Summary Card */}
        <section className="mt-8">
          <div 
            className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <span className="text-3xl">🪙</span>
              NELLYCOIN ECONOMY MANAGER
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="backdrop-blur-xl bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <p className="text-sm text-slate-300 font-semibold mb-1">Total Net NellyCoins</p>
                <p className="text-3xl font-bold text-amber-400">
                  {nellyCoinState.totalCoins.toLocaleString()} 🪙
                </p>
                <p className="text-xs text-slate-400 mt-1">Across 118 active users</p>
              </div>
              <div className="backdrop-blur-xl bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <p className="text-sm text-slate-300 font-semibold mb-1">Pending Dollar Payouts</p>
                <p className="text-3xl font-bold text-green-400">
                  ${nellyCoinState.pendingPayouts.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Awaiting admin clearance</p>
              </div>
            </div>
          </div>
        </section>

          {/* Department Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'optimization' | 'support' | 'tiktok6')} className="w-full">
            <TabsList className="bg-slate-800 border-b border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">📊 Overview Control Deck</TabsTrigger>
              <TabsTrigger value="optimization" className="data-[state=active]:bg-slate-700">📦 Optimization Catalog</TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-slate-700">🎧 Customer Support Core</TabsTrigger>
              <TabsTrigger value="tiktok6" className="data-[state=active]:bg-slate-700">📱 TikTok6 Matrix</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              {/* Overview Control Deck */}
              <section className="mt-8">
                <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                    <span className="text-3xl">🪙</span>
                    NELLYCOIN ECONOMY MANAGER
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="backdrop-blur-xl bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-300 font-semibold mb-1">Total Net NellyCoins</p>
                      <p className="text-3xl font-bold text-amber-400">{nellyCoinState.totalCoins.toLocaleString()} 🪙</p>
                      <p className="text-xs text-slate-400 mt-1">Across 118 active users</p>
                    </div>
                    <div className="backdrop-blur-xl bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-300 font-semibold mb-1">Pending Dollar Payouts</p>
                      <p className="text-3xl font-bold text-green-400">${nellyCoinState.pendingPayouts.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1">Awaiting admin clearance</p>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="optimization" className="mt-4">
              {/* Optimization Catalog */}
              <section>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-2">Product Catalog</h2>
                <ProductCatalogManager />
              </section>
            </TabsContent>

            <TabsContent value="support" className="mt-4">
              {/* Customer Support Core */}
              <section>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-2">Customer Service</h2>
                <AdminCustomerService />
              </section>
            </TabsContent>

            <TabsContent value="tiktok6" className="mt-4">
              {/* TikTok6 Matrix */}
              <section>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-2">TikTok6 Matrix</h2>
                <TikTok6AdminMatch />
              </section>
            </TabsContent>
          </Tabs>
      </div>
    </NellyCoinContext.Provider>
  );
};

export default AIAssistantWorkspace;
