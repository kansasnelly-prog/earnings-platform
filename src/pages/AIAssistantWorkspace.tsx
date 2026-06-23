import React, { useEffect, useState, FC, createContext, useContext } from 'react';
import { useSafeAuth } from '../contexts/SafeAuthProvider';
import { supabase } from '../lib/supabase';
import { logCore, logSupabase, logNellyCoin } from '../utils/logger';
// Tabs UI component for modular navigation
import AdminUsers from '../components/admin/AdminUsers.tsx';
import ProductCatalogManager from '../components/admin/ProductCatalogManager.tsx';
import TikTok6AdminMatch from '../components/admin/TikTok6AdminMatch.tsx';
import AdminControls from '../components/admin/AdminControls.tsx';
import PlatformSwitch from '../components/PlatformSwitch';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Settings, Key, ArrowDownToLine, Package, Heart } from 'lucide-react';

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
  // Admin navigation tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'catalog' | 'match' | 'admin-controls' | 'password-reset' | 'withdrawals' | 'settings'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'catalog' as const, label: 'Product Catalog', icon: Package },
    { id: 'match' as const, label: 'TikTok6 Match', icon: Heart },
    { id: 'admin-controls' as const, label: 'Admin Controls', icon: Settings },
    { id: 'password-reset' as const, label: 'Password Reset', icon: Key },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: ArrowDownToLine },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

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
      <div className="min-h-screen text-slate-100 space-y-8 p-4"
           style={{ background: 'rgba(13, 17, 23, 0.7)', backdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255, 170, 0, 0.15)' }}>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">Admin Workspace</h1>
        <p className="text-sm text-slate-400">AI Service Status: {aiStatus}</p>
        {/* Platform toggle switch for master admin */}
        <PlatformSwitch />
        {/* Navigation tabs */}
        <nav className="flex flex-nowrap overflow-x-auto whitespace-nowrap mb-4"
             style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,170,0,0.5) transparent' }}>
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="gap-2 hover:shadow-[0_0_10px_2px_rgba(255,170,0,0.5)] transition-shadow duration-200"
            >
              <tab.icon size={16} />
              {tab.label}
            </Button>
          ))}
        </nav>

        {/* Conditional content based on active tab */}
        {activeTab === 'overview' && (
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
        )}
        {activeTab === 'users' && (
          <section className="mt-8"><AdminUsers onLogout={logout} /></section>
        )}
        {activeTab === 'catalog' && (
          <section className="mt-8"><ProductCatalogManager /></section>
        )}
        {activeTab === 'match' && (
          <section className="mt-8"><TikTok6AdminMatch /></section>
        )}
        {activeTab === 'admin-controls' && (
          <section className="mt-8"><AdminControls onRefresh={() => {}} /></section>
        )}
        {activeTab === 'withdrawals' && (
          <section className="mt-8"><div className="text-center text-slate-400">Withdrawals section (to be implemented)</div></section>
        )}
        {activeTab === 'settings' && (
          <section className="mt-8"><div className="text-center text-slate-400">Settings section (to be implemented)</div></section>
        )}
        {activeTab === 'password-reset' && (
          <section className="mt-8"><div className="text-center text-slate-400">Password Reset section (to be implemented)</div></section>
        )}
      </div>
    </NellyCoinContext.Provider>
  );
};

export default AIAssistantWorkspace;
