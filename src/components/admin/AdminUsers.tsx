import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { TelegramService } from '@/services/telegramService';
import {
  Shield,
  Users,
  ArrowDownToLine,
  FileText,
  Settings,
  LayoutDashboard,
  RefreshCw,
  LogIn,
  Search,
  Filter,
  AlertTriangle,
  Database,
  UserCheck,
  Target,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  Mail,
  Calendar,
  Zap,
  Crown,
  Star,
  Ban,
  Edit,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  account_type: 'personal' | 'training';
  vip_level: number;
  tasks_completed: number;
  training_progress?: number;
  training_phase?: number;
  total_earned: number;
  balance: number;
  training_completed: boolean;
  referral_code: string;
  created_at: string;
  last_login: string;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
}

interface AdminUsersProps {
  onLogout: () => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ onLogout }) => {
  console.log('[AdminUsers] COMPONENT MOUNTED');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
  const [balanceReason, setBalanceReason] = useState('');
  const [vipLevel, setVipLevel] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if the user is actually online before making the network request
      if (!navigator.onLine) {
        console.warn("[AdminUsers] No internet connection detected. Skipping token refresh.");
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[AdminUsers] ADMIN SESSION:', sessionData.session ? 'Authenticated' : 'Not authenticated');
        console.log('[AdminUsers] Session data:', sessionData);
        setIsAuthenticated(!!sessionData.session);
      } catch (error) {
        // Gracefully handle the "Failed to fetch" network error
        if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
          console.log("[AdminUsers] Network request failed. Will retry when connection is restored.");
        } else {
          console.error('[AdminUsers] Session check error:', error);
          // Clear stale session and tokens on any error
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          setIsAuthenticated(false);
        }
      }
    };

    // Automatically try again the exact moment the internet comes back
    const handleOnline = () => {
      console.log("[AdminUsers] Internet is back! Reloading session...");
      checkAuth();
    };

    window.addEventListener('online', handleOnline);

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AdminUsers] Auth state changed:', session ? 'Authenticated' : 'Not authenticated');
      setIsAuthenticated(!!session);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      subscription.unsubscribe();
    };
  }, []);

  const loadUsers = useCallback(async () => {
    // Don't load users if not authenticated
    if (!isAuthenticated) {
      console.log('[AdminUsers] Skipping user load - not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminUsers] Error loading users from Supabase:', error);
        toast.error('Failed to load users from database');
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('[AdminUsers] No users found in database');
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      // Map Supabase data to User interface with safe fallbacks
      const mappedUsers: User[] = data.map((user: any) => ({
        id: user.id || '',
        email: user.email || '',
        account_type: user.account_type || 'personal',
        vip_level: user.vip_level ?? 1,
        tasks_completed: user.tasks_completed ?? 0,
        training_progress: user.training_progress ?? 0,
        training_phase: user.training_phase ?? 0,
        training_completed: user.training_completed || false,
        total_earned: user.total_earned ?? 0,
        balance: user.balance ?? 0,
        referral_code: user.referral_code || '',
        created_at: user.created_at || new Date().toISOString(),
        last_login: user.last_login || null,
        status: user.user_status || user.status || 'active'
      }));

      setUsers(mappedUsers);
      setFilteredUsers(mappedUsers);
      console.log(`[AdminUsers] Loaded ${mappedUsers.length} users from Supabase`);
    } catch (error) {
      console.error('[AdminUsers] Error loading users:', error);
      toast.error('Failed to load users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, isAuthenticated]);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.referral_code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus]);

  const handleSuspendUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          user_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error suspending user:', error);
        toast.error('Failed to suspend user in database');
        return;
      }

      toast.success(`${email} has been suspended`);
      
      // Send Telegram notification
      TelegramService.sendAdminNotification('Admin', 'User Suspended', `User ${email} status changed to Suspended`).catch(err => {
        console.error('Failed to send Telegram notification:', err);
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          user_status: 'banned',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error banning user:', error);
        toast.error('Failed to ban user in database');
        return;
      }

      toast.success(`${email} has been banned`);
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleActivateUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          user_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error activating user:', error);
        toast.error('Failed to activate user in database');
        return;
      }

      toast.success(`${email} has been activated`);
      
      // Send Telegram notification
      TelegramService.sendAdminNotification('Admin', 'User Activated', `User ${email} status changed to Active`).catch(err => {
        console.error('Failed to send Telegram notification:', err);
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      // Soft delete: update status to 'deleted' in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          user_status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user in database');
        return;
      }

      toast.success(`${email} has been deleted (soft delete)`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      const newBalance = balanceAction === 'add'
        ? (selectedUser.balance || 0) + amount
        : (selectedUser.balance || 0) - amount;

      if (newBalance < 0) {
        toast.error('Insufficient balance for deduction');
        return;
      }

      // Update balance in Supabase
      const { error } = await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating balance:', error);
        toast.error('Failed to update balance in database');
        return;
      }

      toast.success(`Balance ${balanceAction === 'add' ? 'increased' : 'decreased'} by $${amount.toFixed(2)} for ${selectedUser.email}`);
      setShowBalanceModal(false);
      setBalanceAmount('');
      setBalanceReason('');
      loadUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const handleUpdateVip = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      // Update VIP level in Supabase
      const { error } = await supabase
        .from('users')
        .update({ 
          vip_level: vipLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating VIP level:', error);
        toast.error('Failed to update VIP level in database');
        return;
      }

      toast.success(`VIP level updated to ${vipLevel} for ${selectedUser.email}`);
      setShowVipModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating VIP level:', error);
      toast.error('Failed to update VIP level');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Banned</Badge>;
      case 'deleted':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Deleted</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    return type === 'personal' 
      ? <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Personal</Badge>
      : <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Training</Badge>;
  };

  const getVipLevelBadge = (level: number) => {
    return level === 0 
      ? <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Free</Badge>
      : <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">VIP {level}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage all registered users and their accounts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400 w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <Button
            onClick={loadUsers}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${users.reduce((sum, user) => sum + (user.balance || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${users.reduce((sum, user) => sum + (user.total_earned || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No users match your search criteria'
                  : 'No users registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-slate-300 font-medium">User</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Type</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">VIP Level</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Tasks</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Balance</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Earnings</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Status</th>
                    <th className="px-6 py-3 text-slate-300 font-medium min-w-[300px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{user.email}</div>
                          <div className="text-xs text-slate-400">
                            Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getAccountTypeBadge(user.account_type || 'personal')}
                      </td>
                      <td className="px-6 py-4">
                        {getVipLevelBadge(user.vip_level ?? 1)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">
                          {user.tasks_completed ?? 0}
                          <span className="text-xs text-slate-400">
                            /{(user.account_type || 'personal') === 'personal' ? ((user.vip_level ?? 1) === 1 ? 35 : 45) : 45}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          ${(user.balance || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          ${(user.total_earned || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status || 'active')}
                      </td>
                      <td className="px-6 py-4 min-w-[300px]">
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                            className="border-blue-600 text-blue-400 hover:bg-blue-600/10 px-2"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setBalanceAmount('');
                              setBalanceReason('');
                              setShowBalanceModal(true);
                            }}
                            className="border-green-600 text-green-400 hover:bg-green-600/10 px-2"
                            title="Update Balance"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span className="text-xs">Balance</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setVipLevel(user.vip_level ?? 1);
                              setShowVipModal(true);
                            }}
                            className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10 px-2"
                            title="Update VIP Level"
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            <span className="text-xs">VIP</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if ((user.status || 'active') === 'active') {
                                handleSuspendUser(user.id, user.email);
                              } else {
                                handleActivateUser(user.id, user.email);
                              }
                            }}
                            className={(user.status || 'active') === 'active' ? 'border-orange-600 text-orange-400 hover:bg-orange-600/10 px-2' : 'border-green-600 text-green-400 hover:bg-green-600/10 px-2'}
                            title={(user.status || 'active') === 'active' ? 'Suspend User' : 'Activate User'}
                          >
                            {(user.status || 'active') === 'active' ? <Ban className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                            <span className="text-xs">{(user.status || 'active') === 'active' ? 'Freeze' : 'Activate'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="border-red-600 text-red-400 hover:bg-red-600/10 px-2"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            <span className="text-xs">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">User Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserDetails(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Email Address</label>
                    <div className="text-white font-mono">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Account Type</label>
                    <div>{getAccountTypeBadge(selectedUser.account_type || 'personal')}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">VIP Level</label>
                    <div>{getVipLevelBadge(selectedUser.vip_level ?? 1)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Account Status</label>
                    <div>{getStatusBadge(selectedUser.status || 'active')}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Tasks Completed</label>
                    <div className="text-white text-lg">
                      {selectedUser.tasks_completed ?? 0} /
                      {(selectedUser.account_type || 'personal') === 'personal'
                        ? ((selectedUser.vip_level ?? 1) === 1 ? 35 : 45)
                        : 45}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Current Balance</label>
                    <div className="text-white text-lg font-medium">
                      ${(selectedUser.balance || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Total Earnings</label>
                    <div className="text-white text-lg font-medium">
                      ${(selectedUser.total_earned || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Referral Code</label>
                    <div className="text-white font-mono">{selectedUser.referral_code || 'None'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Member Since</label>
                    <div className="text-white">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Last Login</label>
                    <div className="text-white">
                      {selectedUser.last_login
                        ? new Date(selectedUser.last_login).toLocaleString()
                        : 'Never logged in'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balance Management Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Update Balance</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalanceModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">User</label>
                <div className="text-white font-mono">{selectedUser.email}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Current Balance</label>
                <div className="text-white text-lg font-medium">${(selectedUser.balance ?? 0).toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Action</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={balanceAction === 'add' ? 'default' : 'outline'}
                    onClick={() => setBalanceAction('add')}
                    className={balanceAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant={balanceAction === 'deduct' ? 'default' : 'outline'}
                    onClick={() => setBalanceAction('deduct')}
                    className={balanceAction === 'deduct' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                  >
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Deduct
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Reason (Optional)</label>
                <Input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Reason for balance change"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBalanceModal(false);
                    setBalanceAmount('');
                    setBalanceReason('');
                  }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateBalance}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Update Balance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIP Management Modal */}
      {showVipModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Update VIP Level</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVipModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">User</label>
                <div className="text-white font-mono">{selectedUser.email}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Current VIP Level</label>
                <div>{getVipLevelBadge(selectedUser.vip_level ?? 1)}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">New VIP Level</label>
                <select
                  value={vipLevel}
                  onChange={(e) => setVipLevel(parseInt(e.target.value))}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded px-3 py-2"
                >
                  <option value={0}>Free (Level 0)</option>
                  <option value={1}>VIP 1 (Level 1)</option>
                  <option value={2}>VIP 2 (Level 2)</option>
                  <option value={3}>VIP 3 (Level 3)</option>
                  <option value={4}>VIP 4 (Level 4)</option>
                  <option value={5}>VIP 5 (Level 5)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowVipModal(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateVip}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Update VIP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Delete User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Are you sure you want to delete <strong className="text-white">{userToDelete.email}</strong>?
              </p>
              <p className="text-slate-400 text-sm">
                This will soft delete the user (change status to 'deleted'). The user's data will be preserved but they will not appear in the user list.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteUser(userToDelete.id, userToDelete.email)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default AdminUsers;