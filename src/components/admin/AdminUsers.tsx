import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { TelegramService } from '@/services/telegramService';
import {
  Shield,
  Users,
  ArrowDownToLine,
  RefreshCw,
  LogIn,
  Search,
  Filter,
  AlertTriangle,
  DollarSign,
  Activity,
  Eye,
  Crown,
  Ban,
  Trash2,
  XCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  account_type: 'personal' | 'training';
  vip_level: number;
  tasks_completed: number;
  training_progress?: number;
  training_phase?: number;
  training_completed: boolean;
  total_earned: number;
  balance: number;
  referral_code: string;
  created_at: string;
  last_login: string;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
}

interface AdminUsersProps {
  onLogout: () => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ onLogout }) => {
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

  useEffect(() => {
    const checkAuth = async () => {
      if (!navigator.onLine) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        setIsAuthenticated(!!sessionData.session);
      } catch (error) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load users');
        return;
      }

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
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, isAuthenticated]);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.referral_code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus]);

  const handleSuspendUser = async (userId: string, email: string) => {
    try {
      await supabase.from('users').update({ user_status: 'suspended' }).eq('id', userId);
      toast.success(`${email} has been suspended`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    try {
      await supabase.from('users').update({ user_status: 'banned' }).eq('id', userId);
      toast.success(`${email} has been banned`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleActivateUser = async (userId: string, email: string) => {
    try {
      await supabase.from('users').update({ user_status: 'active' }).eq('id', userId);
      toast.success(`${email} has been activated`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      await supabase.from('users').update({ user_status: 'deleted' }).eq('id', userId);
      toast.success(`${email} has been deleted`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      const newBalance = balanceAction === 'add' ? (selectedUser.balance || 0) + amount : (selectedUser.balance || 0) - amount;
      await supabase.from('users').update({ balance: newBalance }).eq('id', selectedUser.id);
      toast.success(`Balance updated for ${selectedUser.email}`);
      setShowBalanceModal(false);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const handleUpdateVip = async () => {
    if (!selectedUser) return;
    try {
      await supabase.from('users').update({ vip_level: vipLevel }).eq('id', selectedUser.id);
      toast.success(`VIP level updated for ${selectedUser.email}`);
      setShowVipModal(false);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update VIP level');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'suspended': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Suspended</Badge>;
      case 'banned': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Banned</Badge>;
      case 'deleted': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Deleted</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage all registered users</p>
        </div>
        <div className="flex items-center space-x-4">
          <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-800 border-slate-600 text-white w-64" />
          <label htmlFor="statusFilter" className="hidden">Filter Status</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <Button onClick={loadUsers} disabled={isLoading} variant="outline" size="sm" className="border-slate-600 text-slate-300">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-slate-300 font-medium">User</th>
                  <th className="px-6 py-3 text-slate-300 font-medium">Type</th>
                  <th className="px-6 py-3 text-slate-300 font-medium">VIP Level</th>
                  <th className="px-6 py-3 text-slate-300 font-medium">Status</th>
                  <th className="px-6 py-3 text-slate-300 font-medium min-w-[300px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">{getAccountTypeBadge(user.account_type)}</td>
                    <td className="px-6 py-4">{getVipLevelBadge(user.vip_level)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                    <td className="px-6 py-4 min-w-[300px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setShowUserDetails(true); }} className="border-blue-600 text-blue-400 px-2" aria-label="View Details"><Eye className="w-4 h-4 mr-1" /><span className="text-xs">View</span></Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setShowBalanceModal(true); }} className="border-green-600 text-green-400 px-2" aria-label="Update Balance"><DollarSign className="w-4 h-4 mr-1" /><span className="text-xs">Balance</span></Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setShowVipModal(true); }} className="border-yellow-600 text-yellow-400 px-2" aria-label="Update VIP"><Crown className="w-4 h-4 mr-1" /><span className="text-xs">VIP</span></Button>
                        <Button size="sm" variant="outline" onClick={() => user.status === 'active' ? handleSuspendUser(user.id, user.email) : handleActivateUser(user.id, user.email)} className={user.status === 'active' ? 'border-orange-600 text-orange-400 px-2' : 'border-green-600 text-green-400 px-2'} aria-label={user.status === 'active' ? 'Freeze User' : 'Activate User'}><Ban className="w-4 h-4 mr-1" /><span className="text-xs">{user.status === 'active' ? 'Freeze' : 'Activate'}</span></Button>
                        <Button size="sm" variant="outline" onClick={() => { setUserToDelete(user); setShowDeleteConfirm(true); }} className="border-red-600 text-red-400 px-2" aria-label="Delete User"><Trash2 className="w-4 h-4 mr-1" /><span className="text-xs">Delete</span></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-white">User Details</CardTitle><Button variant="outline" size="sm" onClick={() => setShowUserDetails(false)} className="border-slate-600" aria-label="Close"><XCircle className="w-4 h-4" /></Button></CardHeader>
            <CardContent><p className="text-white">Email: {selectedUser.email}</p></CardContent>
          </Card>
        </div>
      )}
      {/* ... Add modals for balance, vip, delete confirmation ... */}
    </div>
  );
};
export default AdminUsers;
