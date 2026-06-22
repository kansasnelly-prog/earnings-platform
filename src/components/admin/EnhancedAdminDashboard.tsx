import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, Zap, Lock, Eye, EyeOff, LogIn, TrendingUp,
  UserPlus, DollarSign, Clock, CheckCircle, AlertTriangle, Settings,
  Bell, Database, FileText, CreditCard, UserCheck, Target, Award, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setupRealtimeListeners, logAdminAction } from '@/lib/realtime';
import { sendTelegramNotification } from '@/utils/telegramHelper';
import EnhancedPendingOrdersManager from './EnhancedPendingOrdersManager';

interface RealUser {
  id: string;
  email: string;
  phone?: string;
  display_name?: string;
  vip_level: number;
  balance: number;
  total_earned: number;
  referral_code: string;
  created_at: string;
  last_login?: string;
  account_status: 'active' | 'suspended' | 'flagged';
  is_frozen: boolean;
  tasks_completed: number;
  account_type: 'personal' | 'training';
  referral_count?: number;
  telegram_id?: string;
}

interface RealWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  wallet_type: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  user_email: string;
  user_name: string;
  rejection_reason?: string;
}

interface RealStats {
  totalUsers: number;
  totalPayouts: number;
  pendingPayouts: number;
  totalBalance: number;
  completedTasks: number;
  totalTasks: number;
  activeToday: number;
  pendingWithdrawals: number;
  newUsersToday: number;
  totalEarnings: number;
  averageTasksPerUser: number;
  topPerformers: number;
  flaggedAccounts: number;
}

const EnhancedAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals' | 'accounts' | 'tasks' | 'pending_orders' | 'settings'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [stats, setStats] = useState<RealStats>({
    totalUsers: 0, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0,
    completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0,
    totalEarnings: 0, averageTasksPerUser: 0, topPerformers: 0, flaggedAccounts: 0,
  });

  const [users, setUsers] = useState<RealUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<RealWithdrawal[]>([]);
  const [selectedUser, setSelectedUser] = useState<RealUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [resetTargetEmail, setResetTargetEmail] = useState('');
  const [resetAction, setResetAction] = useState<'personal' | 'training' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Real database functions
  const fetchRealUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_task_assignments(count),
          referral_users:users!referral_code(count)
        `);

      if (error) throw error;

      const processedUsers: RealUser[] = data.map(user => ({
        ...user,
        account_status: user.is_frozen ? 'suspended' : 'active',
        tasks_completed: user.user_task_assignments?.[0]?.count || 0,
        referral_count: user.referral_users?.[0]?.count || 0,
        display_name: user.display_name || user.email.split('@')[0],
      }));

      return processedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const fetchRealWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select(`
          *,
          users: user_id(email, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedWithdrawals: RealWithdrawal[] = data.map(withdrawal => ({
        ...withdrawal,
        user_email: withdrawal.users?.email || 'Unknown',
        user_name: withdrawal.users?.display_name || withdrawal.users?.email?.split('@')[0] || 'Unknown',
      }));

      return processedWithdrawals;
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }
  };

  const fetchRealStats = async () => {
    try {
      const [usersCount, withdrawalsSum, tasksCount, todayUsers] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('payout_requests').select('amount').eq('status', 'completed'),
        supabase.from('user_task_assignments').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
      ]);

      const totalUsers = usersCount.count || 0;
      const totalPayouts = withdrawalsSum.data?.reduce((sum, w) => sum + w.amount, 0) || 0;
      const totalTasks = tasksCount.count || 0;
      const newUsersToday = todayUsers.count || 0;

      const totalBalance = await fetchTotalBalance();
      const pendingWithdrawalsData = await fetchPendingWithdrawals();
      const pendingWithdrawalsCount = pendingWithdrawalsData.length;
      const pendingPayoutsAmount = pendingWithdrawalsData.reduce((sum, w) => sum + w.amount, 0);

      return {
        totalUsers,
        totalPayouts,
        pendingPayouts: pendingPayoutsAmount,
        totalBalance,
        completedTasks: totalTasks,
        totalTasks: totalTasks * 2, // Estimated
        activeToday: newUsersToday,
        pendingWithdrawals: pendingWithdrawalsCount,
        newUsersToday,
        totalEarnings: totalPayouts + totalBalance,
        averageTasksPerUser: totalUsers > 0 ? totalTasks / totalUsers : 0,
        topPerformers: 0, // Calculate from real data
        flaggedAccounts: 0, // Calculate from real data
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return stats;
    }
  };

  const fetchTotalBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance');

      if (error) throw error;
      return data.reduce((sum, user) => sum + (user.balance || 0), 0);
    } catch (error) {
      return 0;
    }
  };

  const fetchPendingWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  };

  const loadData = useCallback(async (showRefreshToast = false) => {
    setIsLoading(true);
    try {
      console.log('[Admin] Loading data from Supabase...');
      console.log('[Admin] Supabase URL:', supabase.supabaseUrl);
      
      // Fetch users from Supabase
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('[Admin] Users query result:', { usersData, usersError });
      
      if (usersError) {
        console.error('[Admin] Users fetch error:', usersError);
        toast({ 
          title: 'Error', 
          description: 'Failed to load users: ' + usersError.message,
          variant: 'destructive'
        });
      } else {
        console.log('[Admin] Loaded', usersData?.length || 0, 'users');
        setUsers(usersData || []);
      }
      
      // Fetch withdrawals from Supabase
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (withdrawalsError) {
        console.error('[Admin] Withdrawals fetch error:', withdrawalsError);
      } else {
        console.log('[Admin] Loaded', withdrawalsData?.length || 0, 'withdrawals');
        setWithdrawals(withdrawalsData || []);
      }
      
      // Calculate stats
      const users = usersData || [];
      const withdrawals = withdrawalsData || [];
      const today = new Date().toISOString().split('T')[0];
      
      setStats({
        totalUsers: users.length,
        totalPayouts: withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + (w.amount || 0), 0),
        pendingPayouts: withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0),
        totalBalance: users.reduce((s, u) => s + (u.balance || 0), 0),
        completedTasks: users.reduce((s, u) => s + (u.tasks_completed || 0), 0),
        totalTasks: users.reduce((s, u) => s + (u.tasks_total || 35), 0),
        activeToday: users.filter(u => u.last_login && u.last_login.startsWith(today)).length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
        newUsersToday: users.filter(u => u.created_at && u.created_at.startsWith(today)).length,
        totalEarnings: users.reduce((s, u) => s + (u.total_earned || 0), 0),
        averageTasksPerUser: users.length > 0 ? users.reduce((s, u) => s + (u.tasks_completed || 0), 0) / users.length : 0,
        topPerformers: users.filter(u => (u.tasks_completed || 0) > 30).length,
        flaggedAccounts: users.filter(u => u.status === 'flagged' || u.status === 'suspended').length,
      });

      if (showRefreshToast && users.length > 0) {
        toast({ 
          title: 'Success', 
          description: `Loaded ${users.length} users from Supabase` 
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to load admin data: ' + (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if the user is actually online before making the network request
      if (!navigator.onLine) {
        console.warn("[EnhancedAdminDashboard] No internet connection detected. Skipping token refresh.");
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setIsAuthenticated(false);
          navigate('/');
          return;
        }

        // Verify user is admin from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('account_type, user_status')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData || userData.account_type !== 'admin') {
          setIsAuthenticated(false);
          navigate('/');
          return;
        }

        setIsAuthenticated(true);
        loadData();
      } catch (error) {
        // Gracefully handle the "Failed to fetch" network error
        if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
          console.log("[EnhancedAdminDashboard] Network request failed. Will retry when connection is restored.");
        } else {
          console.error("[EnhancedAdminDashboard] Unexpected error during auth check:", error);
          setIsAuthenticated(false);
          navigate('/');
        }
      }
    };

    // Automatically try again the exact moment the internet comes back
    const handleOnline = () => {
      console.log("[EnhancedAdminDashboard] Internet is back! Reloading session...");
      checkAuth();
    };

    window.addEventListener('online', handleOnline);

    checkAuth();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [navigate, loadData]);

  // Setup real-time listeners when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = setupRealtimeListeners();
      return cleanup;
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleFreezeUser = async (userId: string) => {
    setProcessingIds(prev => {
      const safePrev = prev || new Set();
      return new Set(safePrev).add(userId);
    });
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_frozen: true, frozen_reason: 'Administrative action' })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_frozen: true, account_status: 'suspended' as const } : u
      ));

      // Log admin action
      await logAdminAction('USER_FREEZE', 'admin@optimize.com', {
        userId,
        reason: 'Administrative action',
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'User Frozen',
        description: 'User account has been frozen successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to freeze user account',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUnfreezeUser = async (userId: string) => {
    setProcessingIds(prev => {
      const safePrev = prev || new Set();
      return new Set(safePrev).add(userId);
    });
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_frozen: false, frozen_reason: null })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_frozen: false, account_status: 'active' as const } : u
      ));

      // Log admin action
      await logAdminAction('USER_UNFREEZE', 'admin@optimize.com', {
        userId,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'User Unfrozen',
        description: 'User account has been unfrozen successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unfreeze user account',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    setProcessingIds(prev => {
      const safePrev = prev || new Set();
      return new Set(safePrev).add(withdrawalId);
    });
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ 
          status: 'completed', 
          processed_at: new Date().toISOString(),
          processed_by: 'admin@optimize.com'
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId ? { ...w, status: 'completed' as const, processed_at: new Date().toISOString() } : w
      ));

      // Log admin action
      await logAdminAction('WITHDRAWAL_APPROVE', 'admin@optimize.com', {
        withdrawalId,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Withdrawal Approved',
        description: 'Withdrawal has been processed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(withdrawalId);
        return newSet;
      });
    }
  };

  // Reset functions for account management
  const resetPersonalAccountTasks = async (email: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    
    setIsResetting(true);
    try {
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'personal')
        .single();

      if (userError || !userData) {
        toast({
          title: 'User Not Found',
          description: 'No personal account found with this email address',
          variant: 'destructive',
        });
        return;
      }

      // Delete all tasks for this user
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userData.id);

      if (deleteError) throw deleteError;

      // VIP1 Personal account: Handle cycle advancement
      const isVIP1 = userData.vip_level === 1;
      const personalCycle = userData.personal_cycle || 1;
      const personalCycleCompleted = userData.personal_cycle_completed || false;

      const updateData: any = {
        tasks_completed: 0,
        updated_at: new Date().toISOString()
      };

      let resetMessage = `Tasks for ${email} have been reset to 0/${userData.vip_level === 1 ? '35' : '45'}. Balance and earnings preserved.`;

      if (isVIP1 && personalCycle === 1 && personalCycleCompleted) {
        // Advance to cycle 2
        updateData.personal_cycle = 2;
        updateData.personal_cycle_completed = false;
        resetMessage = `VIP1 Personal account advanced to Cycle 2. Tasks reset to 0/35. Balance and earnings preserved.`;
      }

      // Reset only tasks, NOT balance or earnings
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id);

      if (updateError) throw updateError;

      // Recreate 35 tasks for the user
      await SupabaseService.createTrainingTasks(userData.id, 35);

      // Log admin action
      await logAdminAction('PERSONAL_ACCOUNT_RESET', 'admin@optimize.com', {
        userId: userData.id,
        email: email,
        resetType: 'personal',
        vipLevel: userData.vip_level,
        cycle: personalCycle,
        timestamp: new Date().toISOString()
      });

      // Send Telegram notification
      await sendTelegramNotification('PERSONAL_ACCOUNT_RESET', {
        email: email,
        userId: userData.id,
        vipLevel: userData.vip_level,
        balance: userData.balance,
        cycle: personalCycle
      });

      toast({
        title: 'Personal Account Reset Successfully',
        description: resetMessage,
      });

      // Refresh data
      loadData();
      setResetTargetEmail('');
      setResetAction(null);
    } catch (error) {
      console.error('Error resetting personal account:', error);
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset personal account tasks',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const resetTrainingAccountTasks = async (email: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    
    setIsResetting(true);
    try {
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();

      if (userError || !userData) {
        toast({
          title: 'User Not Found',
          description: 'No training account found with this email address',
          variant: 'destructive',
        });
        return;
      }

      // Delete all task assignments for this user
      const { error: deleteError } = await supabase
        .from('user_task_assignments')
        .delete()
        .eq('user_id', userData.id);

      if (deleteError) throw deleteError;

      // Reset only tasks and training completion, NOT balance or earnings
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tasks_completed: 0,
          training_completed: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      // Log admin action
      await logAdminAction('TRAINING_ACCOUNT_RESET', 'admin@optimize.com', {
        userId: userData.id,
        email: email,
        resetType: 'training',
        timestamp: new Date().toISOString()
      });

      // Send Telegram notification
      await sendTelegramNotification('TRAINING_ACCOUNT_RESET', {
        email: email,
        userId: userData.id,
        vipLevel: userData.vip_level,
        balance: userData.balance
      });

      toast({
        title: 'Training Account Reset Successfully',
        description: `Tasks for ${email} have been reset to 0/45. Balance and earnings preserved.`,
      });

      // Refresh data
      loadData();
      setResetTargetEmail('');
      setResetAction(null);
    } catch (error) {
      console.error('Error resetting training account:', error);
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset training account tasks',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || user.account_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    return withdrawal.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           withdrawal.wallet_address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // If not authenticated, redirect happens in useEffect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-500" />
                <span className="text-xl font-bold text-white">Admin Dashboard</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
              { id: 'pending_orders', label: 'Pending Orders', icon: AlertTriangle },
              { id: 'accounts', label: 'Account Reset', icon: RefreshCw },
              { id: 'tasks', label: 'Tasks', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content - Always render */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading admin dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Fallback content if data is empty */}
            {users.length === 0 && withdrawals.length === 0 && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  Admin dashboard loaded successfully. No user data available yet.
                </p>
              </div>
            )}
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                      <p className="text-xs text-slate-400">
                        <span className="text-green-400">+{stats.newUsersToday}</span> today
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(2)}</div>
                      <p className="text-xs text-slate-400">Across all users</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">Pending Withdrawals</CardTitle>
                      <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">${stats.pendingPayouts.toFixed(2)}</div>
                      <p className="text-xs text-slate-400">{stats.pendingWithdrawals} requests</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">Completed Tasks</CardTitle>
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stats.completedTasks}</div>
                      <p className="text-xs text-slate-400">
                        {stats.averageTasksPerUser.toFixed(1)} avg per user
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
                        Recent Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{user.display_name}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                            <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                              {user.account_status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-green-500" />
                        Recent Withdrawals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {withdrawals.slice(0, 5).map((withdrawal) => (
                          <div key={withdrawal.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{withdrawal.user_name}</p>
                              <p className="text-xs text-slate-400">${withdrawal.amount.toFixed(2)}</p>
                            </div>
                            <Badge variant={
                              withdrawal.status === 'completed' ? 'default' :
                              withdrawal.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {withdrawal.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search users by name, email, or referral code..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white px-3 py-2 rounded-md"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="flagged">Flagged</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-4 font-medium text-slate-300">User</th>
                            <th className="text-left p-4 font-medium text-slate-300">VIP Level</th>
                            <th className="text-left p-4 font-medium text-slate-300">Balance</th>
                            <th className="text-left p-4 font-medium text-slate-300">Tasks</th>
                            <th className="text-left p-4 font-medium text-slate-300">Status</th>
                            <th className="text-left p-4 font-medium text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium text-white">{user.display_name}</p>
                                  <p className="text-sm text-slate-400">{user.email}</p>
                                  <p className="text-xs text-slate-500">{user.referral_code}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline">VIP{user.vip_level}</Badge>
                              </td>
                              <td className="p-4">
                                <p className="font-mono text-white">${user.balance.toFixed(2)}</p>
                                <p className="text-xs text-slate-400">Earned: ${user.total_earned.toFixed(2)}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-white">{user.tasks_completed}</p>
                                <p className="text-xs text-slate-400">Referrals: {user.referral_count || 0}</p>
                              </td>
                              <td className="p-4">
                                <Badge variant={
                                  user.account_status === 'active' ? 'default' :
                                  user.account_status === 'suspended' ? 'destructive' : 'secondary'
                                }>
                                  {user.account_status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  {!user.is_frozen ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleFreezeUser(user.id)}
                                      disabled={processingIds.has(user.id)}
                                      className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                                    >
                                      <Lock className="w-3 h-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUnfreezeUser(user.id)}
                                      disabled={processingIds.has(user.id)}
                                      className="border-green-600 text-green-400 hover:bg-green-600/10"
                                    >
                                      <Shield className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <Input
                      placeholder="Search withdrawals by user or wallet address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-4 font-medium text-slate-300">User</th>
                            <th className="text-left p-4 font-medium text-slate-300">Amount</th>
                            <th className="text-left p-4 font-medium text-slate-300">Wallet</th>
                            <th className="text-left p-4 font-medium text-slate-300">Status</th>
                            <th className="text-left p-4 font-medium text-slate-300">Date</th>
                            <th className="text-left p-4 font-medium text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWithdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium text-white">{withdrawal.user_name}</p>
                                  <p className="text-sm text-slate-400">{withdrawal.user_email}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-mono text-white">${withdrawal.amount.toFixed(2)}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-sm font-mono text-slate-400">
                                  {withdrawal.wallet_address.slice(0, 8)}...{withdrawal.wallet_address.slice(-8)}
                                </p>
                                <p className="text-xs text-slate-500">{withdrawal.wallet_type}</p>
                              </td>
                              <td className="p-4">
                                <Badge variant={
                                  withdrawal.status === 'completed' ? 'default' :
                                  withdrawal.status === 'pending' ? 'secondary' :
                                  withdrawal.status === 'processing' ? 'outline' : 'destructive'
                                }>
                                  {withdrawal.status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-slate-400">
                                  {new Date(withdrawal.created_at).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="p-4">
                                {withdrawal.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                    disabled={processingIds.has(withdrawal.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {processingIds.has(withdrawal.id) ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pending Orders Tab */}
            {activeTab === 'pending_orders' && (
              <EnhancedPendingOrdersManager />
            )}

            {/* Account Reset Tab */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Account Reset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">Account reset functionality temporarily disabled.</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'training' && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="w-5 h-5 mr-2 text-green-500" />
                      Reset Training Account Tasks
                    </CardTitle>
                    <p className="text-slate-400 text-sm">
                      Reset a training account's tasks to 0/45. Balance and earnings will be preserved.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">User Email</label>
                      <Input
                        type="email"
                        placeholder="Enter training account email"
                        value={resetTargetEmail}
                        onChange={(e) => setResetTargetEmail(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-sm">
                        <strong>Training Account Reset:</strong> Tasks will reset to 0/45. 
                        Balance and earnings will be preserved and continue to accumulate.
                      </p>
                    </div>
                    <Button 
                      type="button"
                      onClick={(e) => resetTrainingAccountTasks(resetTargetEmail, e)}
                      disabled={!resetTargetEmail || isResetting}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isResetting && resetAction === 'training' ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset Training Account Tasks
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Reset History/Info */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Database className="w-5 h-5 mr-2 text-purple-500" />
                      Reset Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-400 mb-2">Personal Account Reset</h4>
                        <ul className="text-xs text-slate-300 space-y-1">
                          <li>• Tasks reset to 0/35</li>
                          <li>• Balance cleared to $0.00</li>
                          <li>• Total earnings reset to $0.00</li>
                          <li>• All task assignments deleted</li>
                          <li>• Account remains active</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <h4 className="text-sm font-medium text-green-400 mb-2">Training Account Reset</h4>
                        <ul className="text-xs text-slate-300 space-y-1">
                          <li>• Tasks reset to 0/45</li>
                          <li>• Balance cleared to $0.00</li>
                          <li>• Total earnings reset to $0.00</li>
                          <li>• Training completion status reset</li>
                          <li>• All task assignments deleted</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-400 mb-2">Important Notes</h4>
                      <ul className="text-xs text-yellow-300 space-y-1">
                        <li>• All reset actions are logged in the admin audit trail</li>
                        <li>• Telegram notifications are sent for each reset</li>
                        <li>• Users will need to complete tasks again to earn</li>
                        <li>• This action cannot be undone</li>
                        <li>• Use with caution and only when necessary</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Settings className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Admin Settings</h3>
                  <p className="text-slate-400">Admin settings interface coming soon...</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EnhancedAdminDashboard;
