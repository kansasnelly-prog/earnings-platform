import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, Zap, Lock, Eye, EyeOff, LogIn, Database
} from 'lucide-react';
import AdminStatsCards, { PlatformStats } from './AdminStatsCards';
import AdminUsersTable, { AdminUser } from './AdminUsersTable';
import AdminWithdrawalsTable, { AdminWithdrawal } from './AdminWithdrawalsTable';
import UserDetailsModal from './UserDetailsModal';
import { SupabaseService } from '@/services/supabaseService';

// Mock data for demo when backend has no data
const generateMockUsers = (): AdminUser[] => {
  const names = [
    'Alex Johnson', 'Maria Garcia', 'James Wilson', 'Sarah Chen', 'Michael Brown',
    'Emma Davis', 'Daniel Martinez', 'Olivia Taylor', 'William Anderson', 'Sophia Thomas',
    'Benjamin Lee', 'Isabella White', 'Lucas Harris', 'Mia Clark', 'Henry Lewis',
    'Charlotte Robinson', 'Alexander Walker', 'Amelia Hall', 'Sebastian Young', 'Harper King',
    'Jack Wright', 'Evelyn Lopez', 'Owen Hill', 'Abigail Scott', 'Liam Green',
    'Emily Adams', 'Noah Baker', 'Ella Nelson', 'Ethan Carter', 'Aria Mitchell',
    'Mason Perez', 'Chloe Roberts', 'Logan Turner', 'Lily Phillips', 'Jacob Campbell',
  ];

  return names.map((name, i) => {
    const completed = Math.floor(Math.random() * 36);
    const earned = completed * (2.5 + Math.random() * 2);
    const balance = earned * (0.3 + Math.random() * 0.7);
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      id: `user_${i + 1}_${Date.now()}`,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      phone: Math.random() > 0.3 ? `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}` : null,
      display_name: name,
      vip_level: Math.min(5, Math.floor(Math.random() * 3) + 1),
      balance: Math.round(balance * 100) / 100,
      total_earned: Math.round(earned * 100) / 100,
      referral_code: `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      created_at: date.toISOString(),
      tasks_completed: completed,
      tasks_total: 35,
    };
  });
};

const generateMockWithdrawals = (users: AdminUser[]): AdminWithdrawal[] => {
  const statuses: AdminWithdrawal['status'][] = ['pending', 'pending', 'pending', 'completed', 'completed', 'processing', 'rejected'];
  const _walletTypes = ['TRC20', 'ERC20', 'BEP20'];


  return Array.from({ length: 18 }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      id: `wd_${i + 1}_${Date.now()}`,
      user_id: user.id,
      amount: Math.round((10 + Math.random() * 140) * 100) / 100,
      wallet_address: `T${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
      status,
      created_at: date.toISOString(),
      processed_at: status === 'completed' || status === 'rejected' ? new Date().toISOString() : null,
      user_name: user.display_name,
      user_email: user.email,
    };
  });
};

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
  const [useMockData, setUseMockData] = useState(false);

  const handleDeleteTrainingUser = async (user: AdminUser) => {
    if (user.account_type !== 'training') {
      toast({ title: 'Error', description: 'Only training accounts can be deleted', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to delete the training account for ${user.display_name} (${user.email})?\n\nThis will permanently remove all data associated with this training account including:\n- User profile\n- Tasks and progress\n- Balance and earnings\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from localStorage
      const email = user.email.toLowerCase();
      
      // Remove training account data
      localStorage.removeItem(`opt_training_data_${email}`);
      localStorage.removeItem(`opt_training_${email}`);
      localStorage.removeItem(`training_tasks_${email}`);
      localStorage.removeItem(`opt_tasks_${user.id}`);
      
      // Try to delete from Supabase if possible
      if (user.id && user.id !== 'mock') {
        await adminInvoke({ action: 'delete_user', userId: user.id });
      }

      // Remove from state
      setUsers(prev => prev.filter(u => u.id !== user.id));
      
      toast({ 
        title: 'Training Account Deleted', 
        description: `Successfully deleted training account for ${user.display_name}` 
      });
    } catch (error) {
      console.error('Error deleting training user:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete training account. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleResetTrainingUser = async (user: AdminUser) => {
    if (user.account_type !== 'training') {
      toast({ title: 'Error', description: 'Only training accounts can be reset', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to reset the training account for ${user.display_name} (${user.email})?\n\nThis will:\n- Reset tasks to 0/45\n- Reset training progress\n- Clear training phase to 1\n- Preserve balance and earnings\n\nThe user will see 0/45 immediately when they refresh.`)) {
      return;
    }

    try {
      const email = user.email.toLowerCase();
      const accountKey = 'training_account_' + email;
      const tasksKey = 'training_tasks_' + email;
      
      console.log('[Admin] Resetting training account:', email);
      
      // Reset tasks to 0/45 - create fresh tasks
      const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
      const resetTasks = Array.from({ length: 45 }, (_, i) => {
        const patternIndex = i % rewardPatterns.length;
        const baseReward = rewardPatterns[patternIndex];
        const variation = (Math.random() - 0.5) * 0.4;
        const finalReward = Math.max(0.5, baseReward + variation);
        
        return {
          id: `task-${Date.now()}-${i}`,
          user_id: email,
          task_number: i + 1,
          title: `Training Task ${i + 1}`,
          description: `Complete training task ${i + 1} for phase 1`,
          status: i === 0 ? 'pending' : 'locked',
          reward: Math.round(finalReward * 100) / 100,
          created_at: new Date().toISOString(),
          completed_at: null,
          task_set: 0,
        };
      });
      
      localStorage.setItem(tasksKey, JSON.stringify(resetTasks));
      
      // Update training account with reset progress
      const trainingData = localStorage.getItem(accountKey);
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        const updatedTrainingAcc = {
          ...trainingAcc,
          tasks_completed: 0,
          training_progress: 0,
          training_phase: 1,
          training_completed: false,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          reset_at: new Date().toISOString(),
          reset_by: 'admin'
        };
        localStorage.setItem(accountKey, JSON.stringify(updatedTrainingAcc));
      }
      
      // Also update opt_user if this training account is currently logged in
      const currentUser = localStorage.getItem('opt_user');
      if (currentUser) {
        const loggedInUser = JSON.parse(currentUser);
        if (loggedInUser.email === email && loggedInUser.account_type === 'training') {
          const resetUser = {
            ...loggedInUser,
            tasks_completed: 0,
            training_progress: 0,
            training_phase: 1,
            training_completed: false,
            trigger_task_number: null,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: false
          };
          localStorage.setItem('opt_user', JSON.stringify(resetUser));
          
          // Broadcast event to notify all tabs/components
          window.dispatchEvent(new CustomEvent('training-account-reset', { detail: { email } }));
          console.log('[Admin] Broadcast training-account-reset event for:', email);
        }
      }
      
      // Update the user in the local state to show 0/45 immediately in admin panel
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, tasks_completed: 0, training_progress: 0, training_phase: 1, training_completed: false }
          : u
      ));
      
      toast({ 
        title: 'Training Account Reset Successfully', 
        description: `Reset ${user.display_name} to 0/45. User will see changes immediately.` 
      });
      
    } catch (error) {
      console.error('Error resetting training user:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to reset training account. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleResetPhase1 = async (user: AdminUser) => {
    if (user.account_type !== 'training' || user.vip_level !== 2) {
      toast({ title: 'Error', description: 'Only VIP2 training accounts can reset Phase 1', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to unlock Phase 1 and start Phase 2 for ${user.display_name} (${user.email})?\n\nThis will:\n- Unlock Phase 1 lock\n- Move to Phase 2\n- Reset tasks to 0/45\n- Create new Phase 2 tasks\n- Preserve balance and earnings\n\nThe user will see Phase 2 immediately when they refresh.`)) {
      return;
    }

    try {
      const result = await SupabaseService.resetPhase1ForUser(user.id);
      
      if (result.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, training_phase_1_locked: false, training_phase: 2, tasks_completed: 0, training_progress: 0 }
            : u
        ));
        
        toast({ 
          title: 'Phase 1 Unlocked Successfully', 
          description: `${user.display_name} can now proceed to Phase 2.` 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error resetting Phase 1:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to unlock Phase 1. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleClearPhase2Checkpoint = async (user: AdminUser) => {
    if (user.account_type !== 'training' || user.vip_level !== 2) {
      toast({ title: 'Error', description: 'Only VIP2 training accounts can clear Phase 2 checkpoint', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to clear the Phase 2 checkpoint for ${user.display_name} (${user.email})?\n\nThis will:\n- Clear the checkpoint status\n- Trigger the 6x profit multiplier\n- Allow user to continue Phase 2 tasks\n\nThe user will see the multiplier applied immediately.`)) {
      return;
    }

    try {
      const result = await SupabaseService.clearPhase2Checkpoint(user.id);
      
      if (result.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, training_phase_2_checkpoint: { ...u.training_phase_2_checkpoint, status: 'cleared' } }
            : u
        ));
        
        toast({ 
          title: 'Phase 2 Checkpoint Cleared', 
          description: `6x multiplier applied for ${user.display_name}.` 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error clearing Phase 2 checkpoint:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to clear Phase 2 checkpoint. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const adminInvoke = async (body: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-handler', { body });
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };

  // Sync training accounts from localStorage to admin panel
  const syncTrainingAccounts = useCallback(() => {
    try {
      const trainingAccounts: AdminUser[] = [];
      
      // Scan localStorage for training accounts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('training_account_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const account = JSON.parse(data);
            trainingAccounts.push({
              id: account.id || key.replace('training_account_', ''),
              email: account.email || key.replace('training_account_', ''),
              display_name: account.display_name || account.email?.split('@')[0] || 'Training User',
              phone: account.phone || null,
              account_type: 'training',
              vip_level: account.vip_level || 2,
              balance: account.balance || 0,
              total_earned: account.total_earned || 0,
              referral_code: account.referral_code || 'N/A',
              status: 'active',
              created_at: account.created_at || new Date().toISOString(),
              tasks_completed: account.tasks_completed || account.training_progress || 0,
              training_progress: account.training_progress || 0,
              training_phase: account.training_phase || 1,
              training_completed: account.training_completed || false
            });
          }
        }
      }
      
      // Also check opt_account_ keys for training accounts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('opt_account_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const account = parsed.user || parsed;
            if (account.account_type === 'training') {
              const existingIndex = trainingAccounts.findIndex(u => u.email === account.email);
              if (existingIndex === -1) {
                trainingAccounts.push({
                  id: account.id || key.replace('opt_account_', ''),
                  email: account.email || key.replace('opt_account_', ''),
                  display_name: account.display_name || account.email?.split('@')[0] || 'Training User',
                  phone: account.phone || null,
                  account_type: 'training',
                  vip_level: account.vip_level || 2,
                  balance: account.balance || 0,
                  total_earned: account.total_earned || 0,
                  referral_code: account.referral_code || 'N/A',
                  status: 'active',
                  created_at: account.created_at || new Date().toISOString(),
                  tasks_completed: account.tasks_completed || account.training_progress || 0,
                  training_progress: account.training_progress || 0,
                  training_phase: account.training_phase || 1,
                  training_completed: account.training_completed || false
                });
              }
            }
          }
        }
      }
      
      return trainingAccounts;
    } catch (error) {
      console.error('Error syncing training accounts:', error);
      return [];
    }
  }, []);

  const loadData = useCallback(async (showRefreshToast = false) => {
    setIsLoading(true);
    try {
      // Try fetching real data
      const [statsRes, usersRes, withdrawalsRes] = await Promise.all([
        adminInvoke({ action: 'get_stats' }),
        adminInvoke({ action: 'get_all_users' }),
        adminInvoke({ action: 'get_all_withdrawals' }),
      ]);

      const hasRealUsers = usersRes?.users && usersRes.users.length > 0;
      const hasRealWithdrawals = withdrawalsRes?.withdrawals && withdrawalsRes.withdrawals.length > 0;

      if (hasRealUsers) {
        // Merge Supabase users with localStorage training accounts
        const localTrainingAccounts = syncTrainingAccounts();
        const supabaseUsers = usersRes.users || [];
        
        // Create a map of existing emails to avoid duplicates
        const existingEmails = new Set(supabaseUsers.map((u: AdminUser) => u.email?.toLowerCase()));
        
        // Add local training accounts that aren't in Supabase
        const mergedUsers = [...supabaseUsers];
        localTrainingAccounts.forEach((localAccount) => {
          if (!existingEmails.has(localAccount.email?.toLowerCase())) {
            mergedUsers.push(localAccount);
          }
        });
        
        setUsers(mergedUsers);
        setUseMockData(false);
      } else {
        // If no Supabase users, use localStorage training accounts
        const localTrainingAccounts = syncTrainingAccounts();
        if (localTrainingAccounts.length > 0) {
          setUsers(localTrainingAccounts);
          setUseMockData(false);
        } else {
          // Fall back to mock data
          const mockUsers = generateMockUsers();
          setUsers(mockUsers);
          setUseMockData(true);
        }
      }
      if (hasRealWithdrawals) {
        setWithdrawals(withdrawalsRes.withdrawals);
      }

      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }

      // If no real data, use mock data for demo
      if (!hasRealUsers) {
        const mockUsers = generateMockUsers();
        setUsers(mockUsers);
        setUseMockData(true);

        if (!hasRealWithdrawals) {
          const mockWithdrawals = generateMockWithdrawals(mockUsers);
          setWithdrawals(mockWithdrawals);
        }

        // Calculate stats from mock data
        const mockWithdrawals = withdrawals.length > 0 ? withdrawals : generateMockWithdrawals(mockUsers);
        const today = new Date().toISOString().split('T')[0];
        setStats({
          totalUsers: mockUsers.length,
          totalPayouts: mockWithdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + w.amount, 0),
          pendingPayouts: mockWithdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0),
          totalBalance: mockUsers.reduce((s, u) => s + u.balance, 0),
          completedTasks: mockUsers.reduce((s, u) => s + u.tasks_completed, 0),
          totalTasks: mockUsers.length * 35,
          activeToday: mockUsers.filter(u => u.created_at.startsWith(today)).length || Math.floor(mockUsers.length * 0.3),
          pendingWithdrawals: mockWithdrawals.filter(w => w.status === 'pending').length,
          newUsersToday: mockUsers.filter(u => u.created_at.startsWith(today)).length || 3,
        });
      }

      if (showRefreshToast) {
        toast({ title: 'Data Refreshed', description: 'Admin dashboard data has been updated.' });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("ADMIN INIT: Session check error:", error);
          // Clear stale session and tokens on any auth error
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          setIsAuthenticated(false);
          navigate('/');
          return;
        }

        if (!session) {
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
      console.error("ADMIN INIT: Unexpected error during auth check:", error);
      // Clear stale session and tokens on any error
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      setIsAuthenticated(false);
      navigate('/');
    };

    checkAuth();
  }, [navigate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleApproveWithdrawal = async (id: string) => {
    setProcessingIds(prev => {
      const safePrev = prev || new Set();
      return new Set(safePrev).add(id);
    });
    try {
      if (!useMockData) {
        const res = await adminInvoke({ action: 'approve_withdrawal', withdrawalId: id });
        if (res?.success) {
          await loadData();
          toast({ title: 'Withdrawal Approved', description: 'The withdrawal has been approved and marked as completed.' });
          return;
        }
      }
      // Mock update
      setWithdrawals(prev => prev.map(w =>
        w.id === id ? { ...w, status: 'completed' as const, processed_at: new Date().toISOString() } : w
      ));
      setStats(prev => {
        const w = withdrawals.find(w => w.id === id);
        if (!w) return prev;
        return {
          ...prev,
          totalPayouts: prev.totalPayouts + w.amount,
          pendingPayouts: prev.pendingPayouts - w.amount,
          pendingWithdrawals: prev.pendingWithdrawals - 1,
        };
      });
      toast({ title: 'Withdrawal Approved', description: 'The withdrawal has been approved and marked as completed.' });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    setProcessingIds(prev => {
      const safePrev = prev || new Set();
      return new Set(safePrev).add(id);
    });
    try {
      if (!useMockData) {
        const res = await adminInvoke({ action: 'reject_withdrawal', withdrawalId: id });
        if (res?.success) {
          await loadData();
          toast({ title: 'Withdrawal Rejected', description: 'The withdrawal has been rejected and funds refunded.' });
          return;
        }
      }
      // Mock update
      setWithdrawals(prev => prev.map(w =>
        w.id === id ? { ...w, status: 'rejected' as const, processed_at: new Date().toISOString() } : w
      ));
      setStats(prev => {
        const w = withdrawals.find(w => w.id === id);
        if (!w) return prev;
        return {
          ...prev,
          pendingPayouts: prev.pendingPayouts - w.amount,
          pendingWithdrawals: prev.pendingWithdrawals - 1,
        };
      });
      toast({ title: 'Withdrawal Rejected', description: 'The withdrawal has been rejected and funds refunded.' });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: ArrowDownToLine, count: withdrawals.filter(w => w.status === 'pending').length },
  ];

  // If not authenticated, redirect happens in useEffect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-indigo-500/30">
            <Shield size={32} className="text-white" />
          </div>
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-indigo-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Back to site"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Admin Panel</span>
                  {useMockData && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">DEMO</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500/15 text-indigo-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Platform Overview</h2>
              <p className="text-sm text-gray-500">Real-time statistics and platform health metrics</p>
            </div>
            <AdminStatsCards stats={stats} isLoading={isLoading} />

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">Recent Users</h3>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{user.display_name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.display_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{user.tasks_completed}/{user.tasks_total} tasks</p>
                        <p className="text-xs text-emerald-400 font-medium">${user.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Withdrawals */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">Pending Withdrawals</h3>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(w => (
                    <div key={w.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{w.user_name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-[160px]">{w.wallet_address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400">${w.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Activity size={24} className="text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No pending withdrawals</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Chart Placeholder */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Platform Activity (Last 7 Days)</h3>
              <div className="flex items-end gap-2 h-40">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const height = 20 + Math.random() * 80;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all group-hover:from-indigo-500 group-hover:to-indigo-300"
                          style={{ height: `${height}%`, minHeight: '8px' }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#141829] border border-white/10 rounded text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {Math.floor(height * 1.5)} actions
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">User Management</h2>
              <p className="text-sm text-gray-500">View and manage all registered users on the platform</p>
            </div>
            <AdminUsersTable
              users={users}
              isLoading={isLoading}
              onViewUser={(user) => setSelectedUser(user)}
              onDeleteUser={handleDeleteTrainingUser}
              onResetTraining={handleResetTrainingUser}
            />
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Withdrawal Management</h2>
              <p className="text-sm text-gray-500">Review, approve, or reject withdrawal requests</p>
            </div>
            <AdminWithdrawalsTable
              withdrawals={withdrawals}
              isLoading={isLoading}
              onApprove={handleApproveWithdrawal}
              onReject={handleRejectWithdrawal}
              processingIds={processingIds}
            />
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onResetTraining={handleResetTrainingUser}
        onDeleteUser={handleDeleteTrainingUser}
        onResetPhase1={handleResetPhase1}
        onClearPhase2Checkpoint={handleClearPhase2Checkpoint}
      />
    </div>
  );
};

export default AdminDashboard;
