import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ArrowDownToLine, AlertCircle, CheckCircle, Clock, XCircle, Loader2, DollarSign, Wallet, History, Lock, Wallet2, ArrowRight } from 'lucide-react';

const WithdrawalSection: React.FC = () => {
  const { user, tasks, wallets, refreshTasks, refreshWallets, isLoading, setActiveTab, requestWithdrawal, getWithdrawalHistory, hasPendingWithdrawal } = useAppContext();
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  // Load data once on mount - use empty deps to avoid infinite loop from changing function refs
  useEffect(() => {
    const loadData = async () => {
      await refreshTasks();
      await refreshWallets();
      // Load withdrawal history from Supabase
      const history = await getWithdrawalHistory();
      setWithdrawals(history);
      // Check if user has pending withdrawal
      const pending = await hasPendingWithdrawal();
      setHasPending(pending);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeTasks = tasks || [];
  const safeWallets = wallets || [];
  const safeWithdrawals = withdrawals;
  
  const completedCount = safeTasks.filter(t => t.status === 'completed').length;
  const isTraining = user?.account_type === 'training';
  const isPersonal = user?.account_type === 'personal';
  const isVIP1 = user?.vip_level === 1;
  
  // Use total_tasks from database
  const totalTasks = user?.total_tasks || 45;
  
  // Training accounts: BOTH sets must be completed (90/90 tasks total = SET 1 + SET 2)
  const trainingFullyCompleted = user?.training_completed === true || 
    (user?.training_phase === 2 && completedCount === 45);
  
  // Task completion checks (no longer blocking withdrawal, but kept for reference)
  const personalTasksComplete = completedCount === totalTasks;
  
  // VIP1 personal: Only allow withdrawal after completing cycle 2
  const vip1BothCyclesComplete = isVIP1 && isPersonal && personalTasksComplete;
  // Non-VIP1 personal: Allow withdrawal after 35/35
  const nonVip1PersonalComplete = !isVIP1 && isPersonal && personalTasksComplete;
  
  const allTasksComplete = isTraining ? trainingFullyCompleted : (isVIP1 ? vip1BothCyclesComplete : nonVip1PersonalComplete);
  // Check for primary wallet first, then fall back to any wallet if primary not found
  // Ensure we get a wallet with actual data (not empty object)
  const primaryWallet = safeWallets.find(w => w.is_primary && w.wallet_address) || 
                       safeWallets.find(w => w.wallet_address) || 
                       safeWallets[0];
  const balance = user?.balance || 0;
  
  console.log('[WithdrawalSection] Wallet state', { safeWallets, primaryWallet, safeWalletsLength: safeWallets.length });

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Withdrawal Submit] Starting submission', { amount, balance, primaryWallet, safeWallets, hasPending });
    
    try {
      const errs: Record<string, string> = {};
      // Use Number() for more robust parsing
      const numAmount = Number(amount);

      console.log('[Withdrawal Submit] Parsed amount', { rawAmount: amount, parsedAmount: numAmount, isNaN: isNaN(numAmount) });

      // Validate amount
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        console.log('[Withdrawal Submit] Invalid amount', { amount, numAmount });
        errs.amount = 'Please enter a valid amount';
      } else if (numAmount < 10) {
        console.log('[Withdrawal Submit] Amount below minimum', { numAmount });
        errs.amount = 'Minimum withdrawal is $10.00';
      } else if (numAmount > balance) {
        console.log('[Withdrawal Submit] Insufficient balance', { numAmount, balance });
        errs.amount = 'Insufficient balance';
      }

      // Wallet validation - bypassed to allow submission if any wallet exists
      const hasValidWallet = primaryWallet && primaryWallet.wallet_address && primaryWallet.wallet_address.length > 0;
      console.log('[Withdrawal Submit] Wallet validation (bypassed)', { primaryWallet, hasValidWallet, safeWalletsLength: safeWallets.length });
      
      // Skip wallet validation check - allow submission if wallet exists in array
      // if (!hasValidWallet) {
      //   console.log('[Withdrawal Submit] No valid wallet found', { primaryWallet, safeWallets });
      //   errs.wallet = 'Please bind a wallet first';
      // }
      
      if (hasPending) {
        console.log('[Withdrawal Submit] Pending withdrawal exists');
        errs.amount = 'You already have a pending withdrawal request. Please wait for admin approval.';
      }

      setErrors(errs);
      if (Object.keys(errs).length > 0) {
        console.log('[Withdrawal Submit] Validation failed', errs);
        // Show toast for validation errors
        Object.values(errs).forEach(error => {
          console.error('[Withdrawal Submit] Error:', error);
        });
        return;
      }

      console.log('[Withdrawal Submit] Validation passed, proceeding with withdrawal');
      setSubmitting(true);
      
      const result = await requestWithdrawal(
        numAmount,
        primaryWallet.wallet_address,
        primaryWallet.wallet_type || 'TRC20'
      );
      
      if (result.success) {
        setAmount('');
        // Refresh withdrawal history
        const history = await getWithdrawalHistory();
        setWithdrawals(history);
        setHasPending(true);
        // Refresh user data to update balance
        const { refreshUser } = useAppContext();
        await refreshUser();
      } else {
        setErrors({ amount: result.error || 'Failed to submit withdrawal request' });
      }
      
      setSubmitting(false);
    } catch (error: any) {
      console.error('[Withdrawal Submit] Exception caught:', error);
      window.alert("Withdrawal Error: " + (error.message || 'Unknown error occurred'));
      setSubmitting(false);
      setErrors({ amount: error.message || 'An unexpected error occurred' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full">
            <CheckCircle size={12} /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/15 text-blue-400 text-xs font-medium rounded-full">
            <Loader2 size={12} className="animate-spin" /> Processing
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/15 text-red-400 text-xs font-medium rounded-full">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 text-amber-400 text-xs font-medium rounded-full">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Available Balance</p>
            <p className="text-4xl font-bold text-white">${balance.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Earned: ${(user?.total_earned || 0).toFixed(2)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              allTasksComplete ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              {allTasksComplete ? (
                <><CheckCircle size={14} className="text-emerald-400" /><span className="text-emerald-400 font-medium">Tasks Complete</span></>
              ) : (
                <><Lock size={14} className="text-amber-400" /><span className="text-amber-400 font-medium">{completedCount}/{isTraining ? 45 : 35} Tasks</span></>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              primaryWallet ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {primaryWallet ? (
                <><CheckCircle size={14} className="text-emerald-400" /><span className="text-emerald-400 font-medium">Wallet Bound</span></>
              ) : (
                <><AlertCircle size={14} className="text-red-400" /><span className="text-red-400 font-medium">No Wallet</span></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Request Withdrawal</h2>
        <p className="text-sm text-gray-500 mb-6">Withdraw your earnings to your bound digital wallet.</p>

        {isTraining && trainingFullyCompleted && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <Wallet2 size={20} className="text-emerald-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-400">Training Account Ready for Withdrawal!</p>
                <p className="text-xs text-gray-400 mt-1">
                  You have completed all 90 training tasks (SET 1 and SET 2). You can now withdraw your full balance of ${balance.toFixed(2)} including your initial deposit and all profits.
                </p>
                <button
                  onClick={() => setAmount(balance.toFixed(2))}
                  className="mt-3 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-all flex items-center gap-2"
                >
                  <DollarSign size={12} />
                  Withdraw All (${balance.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        )}

        {!allTasksComplete && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-400">Tasks Incomplete</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isTraining
                    ? `You need to complete all 90 training tasks (SET 1 and SET 2) before you can withdraw. You are currently in SET ${user?.training_phase || 1} with ${completedCount}/45 tasks completed.`
                    : `You need to complete all ${user?.total_tasks || 35} tasks before you can withdraw. You have completed ${completedCount}/${user?.total_tasks || 35} tasks.`
                  }
                </p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="mt-3 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-all"
                >
                  Go to Tasks
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallet binding banner bypassed - allow submission if wallet exists in array */}
        {/* {!primaryWallet && (
          <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <Wallet size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">No Wallet Bound</p>
                <p className="text-xs text-gray-400 mt-1">
                  You need to bind a digital wallet before you can withdraw funds.
                </p>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Bind Wallet →
                </button>
              </div>
            </div>
          </div>
        )} */}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Withdrawal Amount (USD)</label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                step="0.01"
                min="10"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErrors({}); }}
                placeholder="Minimum $10.00"
                className="w-full pl-10 pr-4 py-3 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            {errors.amount && <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5"><AlertCircle size={12} /> {errors.amount}</p>}
            {errors.tasks && <p className="flex items-center gap-1 text-amber-400 text-xs mt-1.5"><AlertCircle size={12} /> {errors.tasks}</p>}
            {errors.wallet && <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5"><AlertCircle size={12} /> {errors.wallet}</p>}
          </div>

          {primaryWallet && (
            <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Withdrawal Wallet</p>
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-indigo-400" />
                <span className="text-sm text-gray-300">{primaryWallet.wallet_type}</span>
                <span className="text-xs text-gray-500 font-mono truncate">{primaryWallet.wallet_address}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAmount(balance.toFixed(2))}
              className="px-4 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              Max: ${balance.toFixed(2)}
            </button>
            <button
              type="submit"
              disabled={submitting || isLoading || hasPending}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting || isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : hasPending ? (
                <><Clock size={16} /> Pending Approval</>
              ) : (
                <><ArrowDownToLine size={16} /> Request Withdrawal</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-gray-400" />
          <h3 className="text-lg font-bold text-white">Withdrawal History</h3>
        </div>

        {safeWithdrawals.length > 0 ? (
          <div className="space-y-3">
            {safeWithdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <ArrowDownToLine size={18} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">${(w.amount || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{w.wallet_address}</p>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {w.status === 'completed' && w.processed_at && (
                      <p className="text-xs text-emerald-400 mt-0.5">
                        Completed: {new Date(w.processed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(w.status)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History size={32} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No withdrawal history yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalSection;
