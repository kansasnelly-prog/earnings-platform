import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { TELEGRAM_CONFIG } from '@/config/telegram';
import { supabase } from '@/lib/supabase';
import { Shield, Users, DollarSign, RefreshCw, Settings, AlertTriangle, CheckCircle, X, UserPlus, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminPanel: React.FC = () => {
  const { user, resetTrainingProgress, upgradeAccount, createPersonalAccount, isLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState<'users' | 'system' | 'create' | 'training'>('users');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newAccountData, setNewAccountData] = useState({
    email: '',
    displayName: '',
    vipLevel: 1 as 1 | 2
  });
  const [trainingAccountData, setTrainingAccountData] = useState({
    email: '',
    password: '',
    assignedTo: '',
    userReferralCode: '',
    userEmail: ''
  });

  // Mock users data - in real app this would come from backend
  const mockUsers = [
    {
      id: '1',
      email: 'user1@example.com',
      display_name: 'John Doe',
      account_type: 'training' as const,
      training_progress: 12,
      training_completed: false,
      balance: 1125.50,
      vip_level: 0,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      email: 'user2@example.com',
      display_name: 'Jane Smith',
      account_type: 'personal' as const,
      training_progress: 45,
      training_completed: true,
      balance: 2500.00,
      vip_level: 1,
      created_at: '2024-01-10T14:20:00Z'
    },
    {
      id: '3',
      email: 'user3@example.com',
      display_name: 'Bob Johnson',
      account_type: 'personal' as const,
      training_progress: 45,
      training_completed: true,
      balance: 5000.00,
      vip_level: 2,
      created_at: '2024-01-05T09:15:00Z'
    }
  ];

  const handleResetTraining = async (userId: string, userName: string) => {
    const success = await resetTrainingProgress();
    if (success) {
      toast({ title: 'Training Reset', description: `${userName}'s training progress has been reset.` });
    }
  };

  const handleUpgradeUser = async (userId: string, userName: string, vipLevel: 1 | 2) => {
    const success = await upgradeAccount(vipLevel);
    if (success) {
      toast({ title: 'User Upgraded', description: `${userName} has been upgraded to VIP${vipLevel}.` });
    }
  };

  const handleResetPersonalTasks = async (userId: string, userName: string) => {
    // This would reset personal account tasks (70 tasks back to 0)
    toast({ title: 'Personal Tasks Reset', description: `${userName}'s personal tasks have been reset to 0/70.` });
  };

  const handleCreateTrainingAccount = async () => {
    if (!trainingAccountData.email || !trainingAccountData.assignedTo || !trainingAccountData.userReferralCode) {
      toast({ title: 'Error', description: 'Please fill in all fields including referral code', variant: 'destructive' });
      return;
    }
    
    // Generate training account password (6 digits)
    const trainingPassword = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store training account with tracking info
    const trainingAccountInfo = {
      email: trainingAccountData.email,
      password: trainingPassword,
      assignedTo: trainingAccountData.assignedTo,
      userReferralCode: trainingAccountData.userReferralCode,
      userEmail: trainingAccountData.userEmail,
      createdAt: new Date().toISOString()
    };
    
    // Store in localStorage for tracking
    localStorage.setItem('opt_training_' + trainingAccountData.email, JSON.stringify(trainingAccountInfo));
    
    // Send detailed credentials via Telegram with tracking info
    const telegramMessage = `
🎓 <b>VIP2 TRAINING ACCOUNT CREATED</b>

👤 <b>Account Details:</b>
• Email: ${trainingAccountData.email}
• Password: <code>${trainingPassword}</code>
• Assigned to: ${trainingAccountData.assignedTo}
• Account Type: VIP2 Training
• Initial Balance: $1100.00
• Total Tasks: 45/45 (Phase 1)

👥 <b>User Tracking Info:</b>
• User Email: ${trainingAccountData.userEmail}
• Referral Code: ${trainingAccountData.userReferralCode}
• Tracking Status: ACTIVE
• Account Linked: YES

📋 <b>Training Instructions:</b>
1. Login with provided credentials
2. Complete Phase 1: 45 tasks
3. Complete Phase 2: 45 tasks (includes combination order)
4. Complete training to unlock personal account

⚠️ <b>Important Notes:</b>
• Combination order triggers at task 19, 24, or 31 in Phase 2
• Balance will go negative temporarily
• Contact support to clear combination order
• 6x profit applied after clearing

📅 Created: ${new Date().toLocaleString()}

🔗 <a href="https://t.me/EARNINGSLLCONLINECS1">Contact User Support</a>

💾 <b>TRACKING ENABLED:</b>
• This VIP2 training account is linked to referral code: ${trainingAccountData.userReferralCode}
• User progress will be tracked throughout training
• Admin can monitor completion status
• 45/45 tasks available immediately
    `;
    
    // Send to Telegram via Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { message: telegramMessage }
      });

      if (error) {
        console.log('📱 Telegram notification failed:', error);
      } else {
        console.log('✅ Training credentials sent to Telegram');
      }
    } catch (error) {
      console.log('📱 Telegram notification error:', error);
    }

    setTrainingAccountData({ 
      email: '', 
      password: '', 
      assignedTo: '', 
      userReferralCode: '',
      userEmail: ''
    });
    toast({ 
      title: 'VIP2 Training Account Created!', 
      description: `Credentials sent to Telegram for ${trainingAccountData.assignedTo} with 45/45 tasks and tracking enabled` 
    });
  };

  const handleCreatePersonalAccount = async () => {
    if (!newAccountData.email || !newAccountData.displayName) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    
    const success = await createPersonalAccount(newAccountData.email, newAccountData.displayName, newAccountData.vipLevel);
    if (success) {
      setNewAccountData({ email: '', displayName: '', vipLevel: 1 });
      toast({ title: 'Account Created', description: `Personal account created for ${newAccountData.displayName}` });
    }
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-blue-500/15 text-blue-400';
      case 'personal':
        return 'bg-amber-500/15 text-amber-400';
      default:
        return 'bg-gray-500/15 text-gray-400';
    }
  };

  const getVipBadge = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-gray-500/15 text-gray-400';
      case 1:
        return 'bg-amber-500/15 text-amber-400';
      case 2:
        return 'bg-purple-500/15 text-purple-400';
      default:
        return 'bg-gray-500/15 text-gray-400';
    }
  };

  if (!user || user.email !== 'admin@optimize.com') {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Shield size={24} className="text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
        <p className="text-gray-400 text-sm">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-indigo-400" />
            Admin Panel
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage users and system settings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users size={16} />
          Users
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'training'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield size={16} />
          Training
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'create'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus size={16} />
          Create Account
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'system'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={16} />
          System
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Users size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="text-lg font-bold text-white">{mockUsers.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <DollarSign size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Balance</p>
                  <p className="text-lg font-bold text-white">
                    ${mockUsers.reduce((sum, u) => sum + u.balance, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Training Complete</p>
                  <p className="text-lg font-bold text-white">
                    {mockUsers.filter(u => u.training_completed).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {mockUsers.map((mockUser) => (
                    <tr key={mockUser.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{mockUser.display_name}</p>
                          <p className="text-xs text-gray-500">{mockUser.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAccountTypeBadge(mockUser.account_type)}`}>
                            {mockUser.account_type}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getVipBadge(mockUser.vip_level)}`}>
                            VIP{mockUser.vip_level || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-white">
                            {mockUser.training_progress}/45
                          </p>
                          {mockUser.account_type === 'training' && (
                            <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(mockUser.training_progress / 45) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">${mockUser.balance.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {mockUser.account_type === 'training' && (
                            <button
                              onClick={() => handleResetTraining(mockUser.id, mockUser.display_name)}
                              disabled={isLoading}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Reset Training"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          {mockUser.training_completed && mockUser.account_type === 'training' && (
                            <>
                              <button
                                onClick={() => handleUpgradeUser(mockUser.id, mockUser.display_name, 1)}
                                disabled={isLoading}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-50"
                                title="Upgrade to VIP1"
                              >
                                <span className="text-xs font-bold px-1">V1</span>
                              </button>
                              <button
                                onClick={() => handleUpgradeUser(mockUser.id, mockUser.display_name, 2)}
                                disabled={isLoading}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors disabled:opacity-50"
                                title="Upgrade to VIP2"
                              >
                                <span className="text-xs font-bold px-1">V2</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Training Account Tab */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-indigo-400" />
              Create Training Account
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Training Email</label>
                <input
                  type="email"
                  value={trainingAccountData.email}
                  onChange={(e) => setTrainingAccountData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="naomi@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assigned To</label>
                <input
                  type="text"
                  value={trainingAccountData.assignedTo}
                  onChange={(e) => setTrainingAccountData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="User Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">User Email (for tracking)</label>
                <input
                  type="email"
                  value={trainingAccountData.userEmail}
                  onChange={(e) => setTrainingAccountData(prev => ({ ...prev, userEmail: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">User Referral Code (for tracking)</label>
                <input
                  type="text"
                  value={trainingAccountData.userReferralCode}
                  onChange={(e) => setTrainingAccountData(prev => ({ ...prev, userReferralCode: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="OPT-ABC123"
                />
              </div>
              <button
                onClick={handleCreateTrainingAccount}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Creating Training Account...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Create Training Account
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Send size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Training Account Format</h4>
                <p className="text-xs text-blue-400 leading-relaxed">
                  • Email: naomi@gmail.com<br/>
                  • Password: 222222<br/>
                  • Password will be 6 digits (auto-generated)<br/>
                  • Credentials sent to: <a href="https://t.me/EARNINGSLLCONLINECS1" target="_blank" rel="noopener noreferrer" className="underline">@EARNINGSLLCONLINECS1</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Tab */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-indigo-400" />
              Create Personal Account
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newAccountData.email}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={newAccountData.displayName}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">VIP Level</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewAccountData(prev => ({ ...prev, vipLevel: 1 }))}
                    className={`p-3 rounded-lg border transition-all ${
                      newAccountData.vipLevel === 1
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium">VIP1</div>
                    <div className="text-xs opacity-75">0.5% bonus</div>
                  </button>
                  <button
                    onClick={() => setNewAccountData(prev => ({ ...prev, vipLevel: 2 }))}
                    className={`p-3 rounded-lg border transition-all ${
                      newAccountData.vipLevel === 2
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium">VIP2</div>
                    <div className="text-xs opacity-75">1% bonus</div>
                  </button>
                </div>
              </div>
              <button
                onClick={handleCreatePersonalAccount}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create Personal Account
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Send size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Telegram Integration</h4>
                <p className="text-xs text-blue-400 leading-relaxed">
                  Login credentials will be sent to: <a href="https://t.me/EARNINGSLLCONLINECS1" target="_blank" rel="noopener noreferrer" className="underline">@EARNINGSLLCONLINECS1</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-indigo-400" />
              System Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Maintenance Mode</p>
                  <p className="text-xs text-gray-500">Temporarily disable user access</p>
                </div>
                <button className="px-3 py-1.5 bg-gray-500/10 text-gray-400 rounded-lg text-sm">
                  Disabled
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Registration</p>
                  <p className="text-xs text-gray-500">Allow new user registrations</p>
                </div>
                <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm">
                  Enabled
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Task Processing</p>
                  <p className="text-xs text-gray-500">Automatic task verification</p>
                </div>
                <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm">
                  Active
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Admin Notice</h4>
                <p className="text-xs text-amber-400 leading-relaxed">
                  This is a demonstration admin panel. In a production environment, proper authentication 
                  and authorization would be implemented to secure admin functions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
