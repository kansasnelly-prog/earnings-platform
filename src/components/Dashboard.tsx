import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useCSNotification } from '@/contexts/CSNotificationContext';
import { supabase } from '@/lib/supabase';
import { DollarSign, Zap, Award, Wallet, ArrowDownToLine, TrendingUp, CheckCircle, Clock, Lock, ArrowRight, BarChart3, Target, GraduationCap, Star, MessageCircle, AlertTriangle, Home, Play, FileText, Headphones } from 'lucide-react';
import { DailyBonusCompact } from './DailyBonus';
import CombinationOrderModal from './CombinationOrderModal';
import CustomerService from './CustomerService';
import CSSelectionModal from './CSSelectionModal';

const Dashboard: React.FC = () => {
  const context = useAppContext();
  const { user, tasks, wallets, transactions, walletState, refreshTasks, refreshWallets, refreshTransactions, setActiveTab, refreshUser } = context;
  // Defensive loading guard for hard refreshes
  if (!user) {
    return <div className="p-4">Loading System Workspace...</div>;
  }
  const { unreadCount } = useCSNotification();
  
  // Safety wrapper for setActiveTab
  const safeSetActiveTab = (tab: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else {
      console.error('setActiveTab is not a function', context);
    }
  };
  
  const [isTraining, setIsTraining] = useState(user?.account_type === 'training');
  const [isPersonal, setIsPersonal] = useState(user?.account_type === 'personal');
  const [trainingComplete, setTrainingComplete] = useState(user?.training_completed || false);
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [showCSSelection, setShowCSSelection] = useState(false);
  const [showOnlineCS, setShowOnlineCS] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Stub functions for missing context methods
  const clearCombinationOrder = () => {
    console.log('Clear combination order');
  };
  const upgradeAccount = (level?: number) => {
  console.log('Upgrade account', level);
};

  // Load data ONCE when user is available - no retry loop
  useEffect(() => {
    if (!user) {
      setDataLoaded(false);
      return;
    }
    if (dataLoaded) return;
    
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;
    
    const loadData = async () => {
      try {
        // Add timeout protection (15 seconds)
        const dataPromise = Promise.allSettled([
          refreshTasks(),
          refreshWallets(),
          refreshTransactions()
        ]);
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Dashboard data loading timeout')), 15000);
        });
        
        await Promise.race([dataPromise, timeoutPromise]);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Even on error, set dataLoaded to prevent infinite loading
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (!cancelled) setDataLoaded(true);
      }
    };
    
    loadData();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]); // only depend on user, not on unstable function refs

  useEffect(() => {
    try {
      if (user) {
        setIsTraining(user.account_type === 'training');
        setIsPersonal(user.account_type === 'personal');
        setTrainingComplete(user.training_completed);
        
        // Show combination modal when pending order is detected
        if (user.has_pending_order && user.is_negative_balance) {
          setShowCombinationModal(true);
        }
        
        console.log('[Dashboard] Training account state:', {
          task_number: user.task_number,
          completedCount: Math.max(0, (user.task_number || 1) - 1),
          balance: user.balance,
          totalEarned: Math.max(0, (user.balance || 1100) - 1100)
        });
      }
    } catch (err: any) {
      console.error('Error in user effect:', err);
    }
  }, [user]);

  const safeTasks = tasks || [];
  const safeWallets = wallets || [];
  const safeTransactions = transactions || [];
  
  // For training accounts, use Supabase task_number as source of truth
  // completedTasks = task_number - 1 (task_number is the next task to complete)
  const trainingTotalTasks = user?.total_tasks || 45;
  const trainingCompletedCount = isTraining ? Math.max(0, (user?.task_number || 1) - 1) : 0;
  
  // Use trainingTotalTasks for training accounts, 35 for personal accounts
  const totalTasks = isTraining ? trainingTotalTasks : 35;
  
  // Use Supabase-derived count for training, tasks array for personal
  const completedCount = isTraining ? trainingCompletedCount : safeTasks.filter(t => t.status === 'completed').length;
  
  // For VIP1 personal accounts, handle 35/35 completion state
  // If tasks_completed equals 35, show completion state instead of 0/0
  const isFirstSetComplete = !isTraining && user?.vip_level === 1 && (user?.tasks_completed === 35 || completedCount === 35);
  const isSecondSet = !isTraining && user?.vip_level === 1 && user?.tasks_completed > 35;
  const currentSetTotal = isSecondSet ? 35 : 35; // Each set is 35 tasks
  const currentSetCompleted = isSecondSet ? Math.min(completedCount - 35, 35) : completedCount;
  const displayCompletedCount = isFirstSetComplete ? 35 : (isSecondSet ? currentSetCompleted : completedCount);
  const displayTotalTasks = isSecondSet ? 35 : (isFirstSetComplete ? 35 : totalTasks);
  
  // For training accounts, if task_number is 1 (fallback), try to get fresh data from Supabase
  // This prevents stale state on login
  useEffect(() => {
    if (isTraining && user?.task_number === 1 && user?.id) {
      console.log('[Dashboard] Training account task_number is 1 (fallback), fetching fresh data from Supabase');
      const fetchFreshTrainingData = async () => {
        try {
          const { data: trainingAccount } = await supabase
            .from('training_accounts')
            .select('task_number, completed_tasks')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          
          if (trainingAccount) {
            console.log('[Dashboard] Fresh training data from Supabase:', trainingAccount);
            // Refresh user to get fresh data from Supabase
            await refreshUser();
          }
        } catch (error) {
          console.error('[Dashboard] Error fetching fresh training data:', error);
        }
      };
      fetchFreshTrainingData();
    }
  }, [isTraining, user?.task_number, user?.id, refreshUser]);

  // For training accounts, if balance is 0 (fallback), try to get fresh data from Supabase
  // This prevents stale balance state on refresh
  useEffect(() => {
    if (isTraining && user?.balance === 0 && user?.id) {
      console.log('[Dashboard] Training account balance is 0 (fallback), fetching fresh data from Supabase');
      const fetchFreshBalance = async () => {
        try {
          const { data: dbUser } = await supabase
            .from('users')
            .select('balance, total_earned')
            .eq('id', user.id)
            .maybeSingle();
          
          if (dbUser) {
            console.log('[Dashboard] Fresh balance data from Supabase:', dbUser);
            // Refresh user to get fresh data from Supabase
            await refreshUser();
          }
        } catch (error) {
          console.error('[Dashboard] Error fetching fresh balance data:', error);
        }
      };
      fetchFreshBalance();
    }
  }, [isTraining, user?.balance, user?.id, refreshUser]);
  
  const nextTask = safeTasks.find(t => t.status === 'pending');
  
  // Use user.total_earned from database as the single source of truth
  const totalReward = user?.total_earned || 0;
  
  // Calculate progress using display values
  const progress = displayTotalTasks > 0 ? (displayCompletedCount / displayTotalTasks) * 100 : 0;
  const primaryWallet = safeWallets.find(w => w.is_primary);
  const displayRole =
    user?.account_type === 'admin'
      ? 'Admin'
      : user?.vip_level
        ? `VIP${user.vip_level} Member`
        : 'Member';
  const allTasksComplete = isTraining ? completedCount === trainingTotalTasks : completedCount === totalTasks;
  const pendingWithdrawals = safeTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');

  // Show loading state while data is being fetched
  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Welcome Banner */}
      <div className="relative p-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-pink-600/10 border border-indigo-500/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          <div
            className="absolute -right-20 top-0 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl animate-pulse"
            style={{ animationDuration: '6s' }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(120deg, transparent 10%, rgba(255,255,255,0.08) 35%, transparent 65%)',
              backgroundSize: '220% 100%',
              animation: 'shimmer 9s linear infinite'
            }}
          />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        {/* CS Button - Top Right */}
        <button
          onClick={() => setShowCSSelection(true)}
          className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform animate-pulse"
          title="Customer Service"
        >
          <Headphones size={20} className="text-white" />
        </button>
        
        <CSSelectionModal
          isOpen={showCSSelection}
          onClose={() => setShowCSSelection(false)}
          onSelectTelegram={() => {
            setShowCSSelection(false);
            window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
          }}
          onSelectOnline={() => {
            setShowCSSelection(false);
            setShowCustomerService(true);
          }}
        />

        <CustomerService
          isOpen={showCustomerService}
          onClose={() => setShowCustomerService(false)}
        />

        <div className="relative pr-16 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-green-500">
                {isTraining ? 'Welcome back!' : 
                 user?.user_status === 'waiting_for_training' ? 'Account Created!' :
                 `Welcome back, ${user?.display_name || 'User'}!`}
              </h1>
              <p className="text-sm text-gray-400">
                {isTraining
  ? 'Training Account'
  : user?.user_status === 'waiting_for_training'
    ? 'Your training account is being prepared by admin. Please wait...'
    : displayRole}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            {isTraining
  ? trainingComplete
    ? 'Training completed! You can now upgrade to a personal account.'
    : `Complete ${trainingTotalTasks - completedCount} more tasks to finish training.`
  : isFirstSetComplete
    ? 'First set of 35 tasks completed! Contact customer service to continue to the next set.'
    : isSecondSet
      ? `Complete ${displayTotalTasks - displayCompletedCount} more tasks to finish the second set.`
      : allTasksComplete
        ? 'All tasks complete! You can now withdraw your earnings.'
        : user?.tasks_locked
          ? 'Your account is locked until your linked training account completes the full training cycle.'
          : `You have ${totalTasks - completedCount} tasks remaining in your VIP${user?.vip_level || 1} set (${isTraining ? '45' : (user?.vip_level === 1 ? '35' : '45')} tasks total).`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-6 bg-white/[0.02] border rounded-2xl ${
          user?.is_negative_balance ? 'border-red-500/20 bg-red-500/5' : 'border-white/[0.06]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                user?.is_negative_balance ? 'bg-red-500/20' : 'bg-emerald-500/15'
              }`}>
                <DollarSign size={20} className={user?.is_negative_balance ? 'text-red-400' : 'text-emerald-400'} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Balance</h3>
                <p className={`text-sm ${user?.is_negative_balance ? 'text-red-400' : 'text-slate-300'}`}>
                  {user?.is_negative_balance ? 'Negative Balance - Contact Support' : 'Available funds'}
                </p>
              </div>
            </div>
            {user?.has_pending_order && (
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-xs font-medium text-red-400">Pending Order</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
              <p className={`text-3xl font-bold ${
                user?.is_negative_balance ? 'text-red-400' : 'text-white'
              }`}>
                ${(walletState?.available_balance ?? 0).toFixed(2)}
              </p>
              {user?.has_pending_order && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle size={12} />
                  <span>Pending: ${(user?.pending_amount ?? 0).toFixed(2)}</span>
                </div>
              )}
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group cursor-pointer" onClick={() => safeSetActiveTab('tasks')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={20} className="text-indigo-400" />
            </div>
            <Target size={14} className="text-indigo-400" />
          </div>
          <p className="text-sm text-slate-300 font-semibold">Tasks</p>
          <p className="text-2xl font-bold text-white">{displayCompletedCount}<span className="text-sm text-slate-400 font-normal">/{isTraining ? trainingTotalTasks : displayTotalTasks}</span></p>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group cursor-pointer" onClick={() => safeSetActiveTab('profile')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={20} className="text-purple-400" />
            </div>
            <TrendingUp size={14} className="text-purple-400" />
          </div>
          <p className="text-sm text-slate-300 font-semibold">Total Earned</p>
          <p className="text-2xl font-bold text-white">${(totalReward ?? 0).toFixed(2)}</p>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star size={20} className="text-green-400" />
            </div>
            <MessageCircle size={14} className="text-green-400" />
          </div>
          <p className="text-sm text-slate-300 font-semibold">My Referral Code</p>
          <div className="space-y-1">
            <p className="text-lg font-bold text-white">{user?.referral_code || 'N/A'}</p>
            <button 
              onClick={() => {
                if (user?.referral_code) {
                  navigator.clipboard.writeText(user.referral_code);
                  // You could add a toast notification here
                }
              }}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Click to copy
            </button>
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group cursor-pointer" onClick={() => safeSetActiveTab('wallet')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={20} className="text-amber-400" />
            </div>
            {primaryWallet ? <CheckCircle size={14} className="text-emerald-400" /> : <Lock size={14} className="text-amber-400" />}
          </div>
          <p className="text-sm text-slate-300 font-semibold">Wallet</p>
          <p className="text-sm font-bold text-white truncate">{primaryWallet ? primaryWallet.wallet_type : 'Not Bound'}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            {isTraining ? 'Training Progress' : `VIP${user?.vip_level || 1} Progress`}
          </h3>
          <button
            onClick={() => safeSetActiveTab('tasks')}
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            View All Tasks <ArrowRight size={14} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300 font-semibold">{displayCompletedCount} of {isTraining ? trainingTotalTasks : displayTotalTasks} tasks completed</span>
            <span className="text-sm font-bold text-indigo-400">{(progress ?? 0).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Mini Task Preview */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {(isTraining 
            ? Array.from({ length: trainingTotalTasks }, (_, i) => {
                const taskNum = i + 1;
                const currentTaskNum = user?.task_number || 1;
                let status = 'locked';
                if (taskNum < currentTaskNum) status = 'completed';
                else if (taskNum === currentTaskNum) status = 'pending';
                return { task_number: taskNum, status };
              })
            : (isFirstSetComplete 
              ? Array.from({ length: 35 }, (_, i) => ({ task_number: i + 1, status: 'completed' }))
              : (isSecondSet
                ? Array.from({ length: 35 }, (_, i) => {
                    const taskNum = i + 1;
                    const completedInSet = currentSetCompleted;
                    let status = 'locked';
                    if (taskNum <= completedInSet) status = 'completed';
                    else if (taskNum === completedInSet + 1) status = 'pending';
                    return { task_number: taskNum, status };
                  })
                : (safeTasks.length > 0 ? safeTasks : Array.from({ length: 35 }, (_, i) => ({ task_number: i + 1, status: i === 0 ? 'pending' : 'locked' })))
              ))
          ).map((task: any) => (
            <div
              key={task.task_number}
              className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${
                task.status === 'completed' ? 'bg-emerald-500/30 text-emerald-400' :
                task.status === 'pending' ? 'bg-indigo-500/30 text-indigo-400 animate-pulse' :
                'bg-white/5 text-gray-600'
              }`}
            >
              {task.task_number}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isTraining && !trainingComplete && (
          <button
            onClick={() => window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank')}
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all group relative"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors ${unreadCount > 0 ? 'animate-pulse' : ''}`}>
                <MessageCircle size={20} className="text-blue-400" />
              </div>
              <span className="text-white font-semibold">Contact Support</span>
            </div>
            <p className="text-xs text-gray-500">Get help from customer service</p>
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-white text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
              </div>
            )}
          </button>
        )}

        {/* Clear Order - Hidden for training accounts, only admin can clear */}
        {user?.has_pending_order && user?.account_type !== 'training' && (
          <button
            onClick={clearCombinationOrder}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/15 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <span className="text-white font-semibold">Clear Order</span>
            </div>
            <p className="text-xs text-red-400">Clear pending combination order</p>
          </button>
        )}

        {isPersonal && !trainingComplete && (
          <button
            disabled
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl opacity-50 cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Star size={20} className="text-amber-400" />
              </div>
              <span className="text-white font-semibold">Upgrade to VIP1</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Unlock 0.5% task rewards</p>
          </button>
        )}

        {isPersonal && !trainingComplete && (
          <button
            disabled
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl opacity-50 cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Star size={20} className="text-purple-400" />
              </div>
              <span className="text-white font-semibold">Upgrade to VIP2</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Unlock 1% task rewards</p>
          </button>
        )}

        {isTraining && trainingComplete && (
          <button
            onClick={() => upgradeAccount(1)}
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <GraduationCap size={20} className="text-emerald-400" />
              </div>
              <span className="text-white font-semibold">Upgrade to VIP1</span>
            </div>
            <p className="text-xs text-gray-500">Start earning with VIP rewards</p>
          </button>
        )}

        {isPersonal && (
          <button
            onClick={() => safeSetActiveTab('withdraw')}
            className={`p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all group ${
              user?.has_pending_order || user?.is_negative_balance ? 'opacity-50 cursor-not-allowed' : 'opacity-50 cursor-not-allowed'
            }`}
            disabled={true}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Lock size={20} className="text-amber-400" />
              </div>
              <span className="text-white font-semibold">
                Withdrawals Locked
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Complete task cycles to unlock withdrawals
            </p>
          </button>
        )}

        <DailyBonusCompact />
      </div>

      {/* Recent Transactions */}
      {safeTransactions.length > 0 && (
        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Withdrawals</h3>
            <button
              onClick={() => safeSetActiveTab('withdraw')}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {safeTransactions.slice(0, 3).map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ArrowDownToLine size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">${(w.amount ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                 w.status === 'completed'
  ? 'bg-emerald-500/15 text-emerald-400'
  : w.status === 'pending'
  ? 'bg-blue-500/15 text-blue-400'
  : w.status === 'failed'
  ? 'bg-red-500/15 text-red-400'
  : 'bg-amber-500/15 text-amber-400'
                }`}>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 pb-safe pt-2">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
          <button
            onClick={() => safeSetActiveTab('dashboard')}
            className="flex flex-col items-center gap-1"
          >
            <Home className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Home</span>
          </button>
          
          <button 
            onClick={() => safeSetActiveTab('tasks')}
            className="flex flex-col items-center gap-1 relative -top-4"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            <span className="text-white text-xs font-medium">Start</span>
          </button>

          <button
            onClick={() => safeSetActiveTab('withdraw')}
            className="flex flex-col items-center gap-1"
          >
            <FileText className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
