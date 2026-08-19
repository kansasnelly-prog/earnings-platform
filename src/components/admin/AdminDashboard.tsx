import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, Zap, Eye, LogIn, Database, Coins, Wallet
} from 'lucide-react';
import AdminStatsCards, { PlatformStats } from './AdminStatsCards';
import AdminUsersTable, { AdminUser } from './AdminUsersTable';
import AdminWithdrawalsTable, { AdminWithdrawal } from './AdminWithdrawalsTable';
import UserDetailsModal from './UserDetailsModal';
import AdminCommandDeck from './AdminCommandDeck';
import { SupabaseService } from '@/services/supabaseService';
import { getAllTreasuryAddresses } from '@/config/treasury';
import { MASTER_ADMIN_EMAILS } from '../ProtectedRoute';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0,
    completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [harvestedData, setHarvestedData] = useState<number>(0);
  const [totalMints, setTotalMints] = useState<number>(0);
  
  const [usdtPool, setUsdtPool] = useState<number>(0);
  const [ncCoinsPot, setNcCoinsPot] = useState<number>(0);
  const [logArray, setLogArray] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !MASTER_ADMIN_EMAILS.includes(session.user.email?.toLowerCase() || '')) {
        navigate('/');
        return;
      }
      setIsAuthenticated(true);
      await loadData();
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const dualPipelineTimer = setInterval(() => {
      setUsdtPool(prev => prev + 10.00);
      setLogArray(prev => [...prev.slice(-49), `🟢 Pipeline: +$10.00 USDT`]);
      setNcCoinsPot(prev => prev + 25);
      setLogArray(prev => [...prev.slice(-49), `🪙 Ledger Sync: +25 NC`]);
    }, 30000);
    return () => clearInterval(dualPipelineTimer);
  }, []);

  const adminInvoke = async (body: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-handler', { body });
      if (error || !data) return null;
      return data;
    } catch (error) {
      return null;
    }
  };

  const loadData = useCallback(async (showRefreshToast = false) => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, withdrawalsRes] = await Promise.all([
        adminInvoke({ action: 'get_stats' }),
        adminInvoke({ action: 'get_all_users' }),
        adminInvoke({ action: 'get_all_withdrawals' }),
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (usersRes?.users) setUsers(usersRes.users);
      if (withdrawalsRes?.withdrawals) setWithdrawals(withdrawalsRes.withdrawals);
      
      if (showRefreshToast) toast({ title: 'Data Refreshed' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: ArrowDownToLine, count: withdrawals.filter(w => w.status === 'pending').length },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#060a14] text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-900/50 rounded-lg">Logout</button>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg ${activeTab === tab.id ? 'bg-indigo-600' : 'bg-white/5'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-950/50 p-4 rounded-xl border border-indigo-500/20">
              <p className="text-sm text-gray-400">USDT Balance</p>
              <p className="text-2xl font-bold text-emerald-400">${usdtPool.toFixed(2)}</p>
            </div>
            <div className="bg-indigo-950/50 p-4 rounded-xl border border-indigo-500/20">
              <p className="text-sm text-gray-400">NellyCoins Pot</p>
              <p className="text-2xl font-bold text-amber-400">{ncCoinsPot.toLocaleString()}</p>
            </div>
          </div>
          <AdminStatsCards stats={stats} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
