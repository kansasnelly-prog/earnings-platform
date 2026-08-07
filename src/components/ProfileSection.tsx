import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { User, Mail, Phone, Award, Copy, CheckCircle, Calendar, TrendingUp, DollarSign, Zap, Shield, LogOut, Wallet, X, AlertTriangle, Download, Smartphone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TaskHistory from './TaskHistory';
import { supabase } from '@/lib/supabase';
import { sendTelegramNotification } from '@/utils/telegramHelper';

const ProfileSection: React.FC = () => {
  const { user, tasks, walletState, logout, refreshUser } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [showUnbindDialog, setShowUnbindDialog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // MODULE 2: PWA Install Prompt Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if already installed
    const checkInstalled = () => {
      setDeferredPrompt(null);
    };
    
    window.addEventListener('appinstalled', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', checkInstalled);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Not Available',
        description: 'PWA installation is not available on this device',
        variant: 'destructive'
      });
      return;
    }

    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // MODULE 4: Platform Detection & Balance Reward
        const userAgent = navigator.userAgent;
        const platform = userAgent.includes('Android') ? 'Android' : 
                         userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iPhone' : 'Desktop';
        
        console.log('[PWA] App installed on platform:', platform);
        
        // Credit user balance with promotional signup reward
        const rewardAmount = 5.00; // $5 promotional reward
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            balance: (user?.balance || 0) + rewardAmount,
            total_earned: (user?.total_earned || 0) + rewardAmount
          })
          .eq('id', user?.id);

        if (updateError) {
          console.error('[PWA] Failed to credit reward:', updateError);
        } else {
          toast({
            title: 'Installation Successful!',
            description: `You've earned $${rewardAmount.toFixed(2)} bonus reward for installing the app!`,
            variant: 'default'
          });
          await refreshUser();
        }
        
        // Send Telegram notification
        await sendTelegramNotification({
          type: 'user_login',
          email: user?.email,
          platform: platform,
          rewardAmount: rewardAmount,
          timestamp: new Date().toISOString()
        } as any);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Installation error:', error);
      toast({
        title: 'Installation Failed',
        description: 'Failed to install the app',
        variant: 'destructive'
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const safeTasks = tasks || [];
  const completedCount = safeTasks.filter(t => t.status === 'completed').length;
  const totalReward = safeTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward, 0);
  const progress = safeTasks.length > 0 ? (completedCount / safeTasks.length) * 100 : 0;

  const copyReferral = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const walletAddress = user?.wallet_address || null;
  const isWalletBound = !!walletAddress;

  const maskWalletAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleBindWallet = async () => {
    if (!walletInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a wallet address',
        variant: 'destructive',
      });
      return;
    }

    setIsBinding(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: walletInput.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      // Send Telegram notification
      await sendTelegramNotification({
        type: 'wallet_bind',
        email: user?.email,
        accountType: user?.account_type,
        walletAddress: walletInput.trim(),
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: 'Wallet address bound successfully',
      });
      setWalletInput('');
      await refreshUser();
    } catch (error) {
      console.error('Error binding wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to bind wallet address',
        variant: 'destructive',
      });
    } finally {
      setIsBinding(false);
    }
  };

  const handleUnbindWallet = async () => {
    setIsBinding(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: null })
        .eq('id', user?.id);

      if (error) throw error;

      // Send Telegram notification
      await sendTelegramNotification({
        type: 'wallet_unbind',
        email: user?.email,
        accountType: user?.account_type,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: 'Wallet address unbound successfully',
      });
      setShowUnbindDialog(false);
      await refreshUser();
    } catch (error) {
      console.error('Error unbinding wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to unbind wallet address',
        variant: 'destructive',
      });
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <span className="text-3xl font-bold text-white">{user?.display_name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{user?.display_name || 'User'}</h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">VIP{user?.vip_level || 1}</span>
            </div>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 2: PWA Install Trigger Button */}
      {deferredPrompt && (
        <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Smartphone size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Download Mobile App</h3>
              <p className="text-sm text-gray-400">Install the app & claim $5 balance reward!</p>
            </div>
            <button
              onClick={handlePWAInstall}
              disabled={isInstalling}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Install App
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Balance</p>
          <p className="text-xl font-bold text-emerald-400">${(walletState?.available_balance ?? 0).toFixed(2)}</p>
        </div>
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-indigo-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Earned</p>
          <p className="text-xl font-bold text-indigo-400">${(walletState?.total_earned ?? 0).toFixed(2)}</p>
        </div>
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
            <Zap size={18} className="text-purple-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Tasks Done</p>
          <p className="text-xl font-bold text-purple-400">
            {user?.account_type === 'training'
              ? user?.training_completed === true || (user?.training_phase === 2 && (user?.task_number ?? 1) >= (user?.total_tasks || 45))
                ? 'TRAINING COMPLETE'
                : user?.training_phase === 2 && (user?.task_number ?? 1) === 0
                ? 'SET 1 COMPLETED'
                : `SET ${user?.training_phase || 1}/${user?.task_number ?? 1}`
              : `${completedCount}/${user?.total_tasks || 35}`}
          </p>
        </div>
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
            <Award size={18} className="text-amber-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">VIP Level</p>
          <p className="text-xl font-bold text-amber-400">Level {user?.vip_level || 1}</p>
        </div>
      </div>

      <TaskHistory />

      {/* Progress */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Task Progress</h3>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">VIP{user?.vip_level || 1} Completion</span>
            <span className="text-sm font-bold text-indigo-400">{(progress ?? 0).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{completedCount} completed</span>
          <span>{(user?.account_type === 'training' ? 45 : 35) - completedCount} remaining</span>
        </div>
      </div>

      {/* Referral Code */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Referral Code</h3>
        <p className="text-sm text-gray-500 mb-4">Share your referral code with friends to earn bonus rewards.</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-[#1a2038] border border-indigo-500/20 rounded-lg">
            <code className="text-lg font-bold text-indigo-300 tracking-wider">{user?.referral_code || 'N/A'}</code>
          </div>
          <button
            onClick={copyReferral}
            className="p-3 bg-indigo-500/15 border border-indigo-500/25 rounded-lg hover:bg-indigo-500/25 transition-colors"
          >
            {copied ? <CheckCircle size={20} className="text-emerald-400" /> : <Copy size={20} className="text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
            <User size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Display Name</p>
              <p className="text-sm text-white font-medium">{user?.display_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
            <Mail size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-white font-medium">{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
            <Phone size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-white font-medium">{user?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Binding */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Wallet Address</h3>
        {!isWalletBound ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Bind your wallet address to enable withdrawals.</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="Enter wallet address (e.g., 0x1234...abcd)"
                className="flex-1 p-3 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                disabled={isBinding}
              />
              <button
                onClick={handleBindWallet}
                disabled={isBinding || !walletInput.trim()}
                className="px-6 py-3 bg-indigo-500/15 border border-indigo-500/25 rounded-lg text-indigo-400 font-semibold hover:bg-indigo-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBinding ? 'Binding...' : 'Bind Wallet'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500">Bound Wallet</p>
                <p className="text-sm text-white font-medium font-mono">{maskWalletAddress(walletAddress)}</p>
              </div>
            </div>
            <button
              onClick={() => setShowUnbindDialog(true)}
              className="px-4 py-2 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
            >
              Unbind
            </button>
          </div>
        )}
      </div>

      {/* Unbind Confirmation Dialog */}
      {showUnbindDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2038] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-amber-400" />
              <h3 className="text-xl font-bold text-white">Unbind Wallet</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove this wallet? This action will unbind your wallet address from your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnbindDialog(false)}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnbindWallet}
                disabled={isBinding}
                className="flex-1 px-4 py-3 bg-red-500/15 border border-red-500/25 rounded-lg text-red-400 font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBinding ? 'Unbinding...' : 'Confirm Unbind'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">Account Status</p>
                <p className="text-xs text-gray-500">Your account is active and verified</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full">Active</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full p-4 bg-red-500/5 border border-red-500/15 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-semibold hover:bg-red-500/10 transition-all"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
};

export default ProfileSection;
