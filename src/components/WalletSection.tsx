import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Wallet, Copy, CheckCircle, Plus, Shield, AlertCircle, Loader2, ExternalLink, History, DollarSign, ArrowUpRight, TrendingUp, ArrowDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TransactionHistory from './TransactionHistory';
import { type WalletState } from '@/contexts/AppContext';
import { sendTelegramNotification } from '@/utils/telegramHelper';

const WALLET_TYPES = [
  { value: 'USDT-TRC20', label: 'USDT (TRC20)', network: 'Tron Network' },
  { value: 'USDT-ERC20', label: 'USDT (ERC20)', network: 'Ethereum Network' },
  { value: 'USDT-BEP20', label: 'USDT (BEP20)', network: 'BSC Network' },
  { value: 'BTC', label: 'Bitcoin (BTC)', network: 'Bitcoin Network' },
];

const WalletSection: React.FC = () => {
  const { wallets, refreshWallets, addWallet, isLoading, walletState, user, tasks } = useAppContext();
  const [showBindForm, setShowBindForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('USDT-TRC20');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank_transfer' | 'crypto' | 'other'>('crypto');
  const [accountDetails, setAccountDetails] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const safeTasks = tasks || [];

  const safeWallets = wallets || [];
  const primaryWallet = safeWallets.find(w => w.is_primary);

  // Force re-render when wallets change to update UI
  useEffect(() => {
    console.log('[WalletSection] Wallets changed', { wallets, primaryWallet });
  }, [wallets, primaryWallet]);

  const validateAddress = (address: string, type: string): boolean => {
    if (!address.trim()) {
      setErrors({ address: 'Wallet address is required' });
      return false;
    }
    if (address.length < 20) {
      setErrors({ address: 'Invalid wallet address format' });
      return false;
    }
    // Basic validation per type
    if (type === 'USDT-TRC20' && !address.startsWith('T')) {
      setErrors({ address: 'TRC20 addresses must start with T' });
      return false;
    }
    if ((type === 'USDT-ERC20' || type === 'USDT-BEP20') && !address.startsWith('0x')) {
      setErrors({ address: 'ERC20/BEP20 addresses must start with 0x' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Wallet Bind] handleBind called', { walletAddress, walletType, isLoading });
    try {
      if (!validateAddress(walletAddress, walletType)) {
        console.log('[Wallet Bind] Validation failed', errors);
        return;
      }
      console.log('[Wallet Bind] Validation passed, calling addWallet');
      const success = await addWallet(walletAddress, walletType);
      console.log('[Wallet Bind] addWallet returned', success);
      if (success) {
        // Send Telegram notification for wallet bind
        await sendTelegramNotification({
          type: 'wallet_bind',
          email: user?.email,
          accountType: user?.account_type,
          walletAddress: walletAddress,
          timestamp: new Date().toISOString()
        });
        console.log('[Wallet Bind] Telegram notification sent');

        // Explicitly refresh state to update UI
        console.log('[Wallet Bind] Refreshing wallets and user state');
        await refreshWallets();
        console.log('[Wallet Bind] Wallets refreshed');

        setWalletAddress('');
        setShowBindForm(false);
      }
    } catch (error) {
      console.error('[Wallet Bind] Exception:', error);
      toast({
        title: 'Error',
        description: 'Failed to bind wallet. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: 'Copied!', description: 'Wallet address copied to clipboard.' });
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Wallet Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your balance and withdrawal settings</p>
        </div>
        <button
          onClick={() => setShowBindForm(!showBindForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/25"
        >
          <Plus size={16} />
          Bind Wallet
        </button>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400 font-medium">Available Balance</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">${walletState.available_balance.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-400 font-medium">Pending Balance</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">${walletState.pending_balance.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-400 font-medium">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-indigo-400">${walletState.total_earned.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400 font-medium">Total Withdrawn</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">${walletState.total_withdrawn.toFixed(2)}</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <button
        onClick={() => setShowWithdrawForm(!showWithdrawForm)}
        disabled={walletState.available_balance < 10}
        className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowUpRight size={20} />
        Request Withdrawal
        <span className="text-sm opacity-80">(${walletState.available_balance.toFixed(2)} available)</span>
      </button>

      {/* Withdrawal Form */}
      {showWithdrawForm && (
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-emerald-400" />
            Request Withdrawal
          </h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const amount = parseFloat(withdrawAmount);
            if (isNaN(amount) || amount < 10) {
              setErrors({ amount: 'Minimum withdrawal is $10' });
              return;
            }
            if (amount > walletState.available_balance) {
              setErrors({ amount: 'Insufficient available balance' });
              return;
            }
            if (!accountDetails.trim()) {
              setErrors({ accountDetails: 'Account details are required' });
              return;
            }
            // For now, just show a toast (backend integration later)
            toast({
              title: 'Withdrawal Request Submitted',
              description: `Withdrawal of $${amount.toFixed(2)} via ${withdrawMethod} submitted for processing.`
            });
            setShowWithdrawForm(false);
            setWithdrawAmount('');
            setAccountDetails('');
            setErrors({});
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (USD)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => { setWithdrawAmount(e.target.value); setErrors({}); }}
                placeholder="10.00"
                min="10"
                max={walletState.available_balance}
                step="0.01"
                className="w-full px-4 py-3 bg-[#1a2038] border border-emerald-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm"
              />
              {errors.amount && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle size={12} /> {errors.amount}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Available: ${walletState.available_balance.toFixed(2)} | Minimum: $10.00</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Withdrawal Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setWithdrawMethod('crypto'); setErrors({}); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    withdrawMethod === 'crypto'
                      ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className={`text-sm font-semibold ${withdrawMethod === 'crypto' ? 'text-emerald-300' : 'text-gray-300'}`}>
                    Crypto
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setWithdrawMethod('bank_transfer'); setErrors({}); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    withdrawMethod === 'bank_transfer'
                      ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className={`text-sm font-semibold ${withdrawMethod === 'bank_transfer' ? 'text-emerald-300' : 'text-gray-300'}`}>
                    Bank
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setWithdrawMethod('other'); setErrors({}); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    withdrawMethod === 'other'
                      ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className={`text-sm font-semibold ${withdrawMethod === 'other' ? 'text-emerald-300' : 'text-gray-300'}`}>
                    Other
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Account Details</label>
              <textarea
                value={accountDetails}
                onChange={e => { setAccountDetails(e.target.value); setErrors({}); }}
                placeholder={withdrawMethod === 'crypto' ? 'USDT-TRC20 Address: T...' : withdrawMethod === 'bank_transfer' ? 'Bank Name, Account Number, Routing Number...' : 'Enter your payment details...'}
                rows={3}
                className="w-full px-4 py-3 bg-[#1a2038] border border-emerald-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-none"
              />
              {errors.accountDetails && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle size={12} /> {errors.accountDetails}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowWithdrawForm(false); setErrors({}); setWithdrawAmount(''); setAccountDetails(''); }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bind Wallet Form */}
      {showBindForm && (
        <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-indigo-400" />
            Bind New Wallet
          </h3>
          <form onSubmit={handleBind} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Wallet Network</label>
              <div className="grid grid-cols-2 gap-2">
                {WALLET_TYPES.map(wt => (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => { setWalletType(wt.value); setErrors({}); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      walletType === wt.value
                        ? 'bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${walletType === wt.value ? 'text-indigo-300' : 'text-gray-300'}`}>
                      {wt.label}
                    </div>
                    <div className="text-xs text-gray-500">{wt.network}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={e => { setWalletAddress(e.target.value); setErrors({}); }}
                placeholder={walletType === 'USDT-TRC20' ? 'T...' : walletType === 'BTC' ? 'bc1...' : '0x...'}
                className="w-full px-4 py-3 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
              />
              {errors.address && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle size={12} /> {errors.address}
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
              <p className="text-xs text-amber-400/80 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                Please double-check your wallet address. Incorrect addresses may result in permanent loss of funds.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowBindForm(false); setErrors({}); setWalletAddress(''); }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Binding...</> : 'Confirm Binding'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Wallet */}
      {primaryWallet ? (
        <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Wallet size={20} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Primary Wallet</h3>
                <p className="text-xs text-gray-500">{primaryWallet.wallet_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
            <code className="flex-1 text-sm text-indigo-300 font-mono truncate">{primaryWallet.wallet_address}</code>
            <button
              onClick={() => copyToClipboard(primaryWallet.wallet_address, primaryWallet.id)}
              className="flex-shrink-0 p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {copied === primaryWallet.id ? (
                <CheckCircle size={16} className="text-emerald-400" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Bound on {new Date(primaryWallet.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      ) : (
        <div className="p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-center">
          <Wallet size={40} className="text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-300 mb-1">No Wallet Bound</h3>
          <p className="text-sm text-gray-500 mb-4">Bind a digital wallet to enable withdrawals.</p>
          <button
            onClick={() => setShowBindForm(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Bind Your Wallet
          </button>
        </div>
      )}

      {/* All Wallets */}
      {safeWallets.length > 1 && (
        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">All Wallets</h3>
          <div className="space-y-3">
            {safeWallets.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Wallet size={16} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{w.wallet_type}</span>
                      {w.is_primary && <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded">PRIMARY</span>}
                    </div>
                    <code className="text-xs text-gray-500 font-mono">{truncateAddress(w.wallet_address)}</code>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(w.wallet_address, w.id)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                >
                  {copied === w.id ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <History size={18} className="text-indigo-400" />
            Transaction History
          </h3>
          <span className="text-xs text-gray-500">{walletState.transactions.length} transactions</span>
        </div>
        {walletState.transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {walletState.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'task_reward' || tx.type === 'bonus' ? 'bg-emerald-500/10' :
                  tx.type === 'withdrawal_request' ? 'bg-amber-500/10' :
                  tx.type === 'withdrawal_completed' ? 'bg-purple-500/10' :
                  tx.status === 'failed' ? 'bg-red-500/10' : 'bg-indigo-500/10'
                }`}>
                  {tx.type === 'task_reward' || tx.type === 'bonus' ? (
                    <DollarSign size={20} className="text-emerald-400" />
                  ) : tx.type === 'withdrawal_request' ? (
                    <Loader2 size={20} className="text-amber-400" />
                  ) : tx.type === 'withdrawal_completed' ? (
                    <CheckCircle size={20} className="text-purple-400" />
                  ) : (
                    <History size={20} className="text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className={`text-sm font-bold ${
                  tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Wallet Security</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your wallet addresses are encrypted and stored securely. We never store private keys or seed phrases. 
              Only bind wallets that you have full control over. Withdrawals are processed to your primary wallet address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSection;
