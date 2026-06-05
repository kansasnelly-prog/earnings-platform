import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { TelegramService } from '@/services/telegramService';
import { SupabaseService } from '@/services/supabaseService';
import { logCore, logSupabase, logAdmin, logError, logTelegram } from '@/utils/logger';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, LogIn, Headphones, Settings, UserPlus,
  AlertTriangle, DollarSign, CheckCircle, Search, ShoppingBag, Sparkles, Key
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// AdminTasksManagement removed - using ProductCatalogManager (Supabase-based) instead
import AdminCustomerService from './AdminCustomerService';
import AdminControls from './AdminControls';
import AccountCreation from './AccountCreation';
import EnhancedPendingOrdersManager from './EnhancedPendingOrdersManager';
import ProductCatalogManager from './ProductCatalogManager';
import AdminUsers from './AdminUsers';
import AdminPasswordReset from './AdminPasswordReset';
import { sendTelegramNotification } from '@/lib/realtime';
import AdBanner from '../AdBanner';

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
  tasks_total?: number;
  account_type: 'personal' | 'training';
  referral_count?: number;
  status?: string;
  user_status?: string;
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

interface RevenueStats {
  totalAppInstalls: number;
  androidInstalls: number;
  iosInstalls: number;
  nellyCoinsFromInstalls: number;
  adRevenueUSD: number;
  adECPM: number;
  activeVIPSubscriptions: number;
  vipRevenueUSD: number;
  withdrawalFeesUSD: number;
  taskTaxUSD: number;
  marketplaceRevenueUSD: number;
  appStoreRevenueUSD: number;
  referralRevenueUSD: number;
  totalRevenueUSD: number;
  totalNellyCoinsMinted: number;
}

const MainAdminPanel: React.FC = () => {
  logCore('MainAdminPanel COMPONENT RENDERED');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals' | 'pending-orders' | 'customer-service' | 'product-catalog' | 'admin-controls' | 'create-account' | 'password-reset'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

  logCore('Current isAuthenticated state', isAuthenticated);

  const [stats, setStats] = useState<RealStats>({
    totalUsers: 0, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0,
    completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0,
    totalEarnings: 0, averageTasksPerUser: 0, topPerformers: 0, flaggedAccounts: 0,
  });

  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalAppInstalls: 0,
    androidInstalls: 0,
    iosInstalls: 0,
    nellyCoinsFromInstalls: 0,
    adRevenueUSD: 0,
    adECPM: 0,
    activeVIPSubscriptions: 0,
    vipRevenueUSD: 0,
    withdrawalFeesUSD: 0,
    taskTaxUSD: 0,
    marketplaceRevenueUSD: 0,
    appStoreRevenueUSD: 0,
    referralRevenueUSD: 0,
    totalRevenueUSD: 0,
    totalNellyCoinsMinted: 0,
  });

  const [users, setUsers] = useState<RealUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<RealWithdrawal[]>([]);
  const [selectedUser, setSelectedUser] = useState<RealUser | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [pendingOrderUsers, setPendingOrderUsers] = useState<RealUser[]>([]);
  const [pendingOrderSearch, setPendingOrderSearch] = useState('');

  // User action modals state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceAction, setBalanceAction] = useState<'add' | 'reduce'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [newVipLevel, setNewVipLevel] = useState<number>(1);
  
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);


  useEffect(() => {
    const checkAuth = async () => {
      logCore('ADMIN INIT: Checking Supabase Auth session');

      // Check if the user is actually online before making the network request
      if (!navigator.onLine) {
        logCore('[ADMIN INIT] No internet connection detected. Skipping token refresh.');
        setIsInitialized(true);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        logCore('ADMIN INIT: Supabase session', session ? 'Found' : 'Not found');

        if (error) {
          logError('ADMIN INIT: Session check error', error);
          // Clear stale session and tokens on any auth error
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          setIsAuthenticated(false);
          setIsInitialized(true);
          navigate('/');
          return;
        }

        if (!session) {
          logCore('ADMIN INIT: No session found, redirecting to main site to login');
          setIsAuthenticated(false);
          setIsInitialized(true);
          navigate('/');
          return;
        }

        // Verify user is admin from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('account_type, user_status')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData) {
          logError('ADMIN INIT: User data fetch error', userError);
          setIsAuthenticated(false);
          setIsInitialized(true);
          navigate('/');
          return;
        }

        if (userData.account_type !== 'admin') {
          logCore('ADMIN INIT: User is not admin, account_type', userData.account_type);
          setIsAuthenticated(false);
          setIsInitialized(true);
          navigate('/');
          return;
        }

        logCore('ADMIN INIT: User is admin, authenticated');
        setIsAuthenticated(true);
        setIsInitialized(true);
        loadData();
      } catch (error) {
        // Gracefully handle the "Failed to fetch" network error
        if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
          logCore('[ADMIN INIT] Network request failed. Will retry when connection is restored.');
          setIsInitialized(true);
        } else {
          logError('ADMIN INIT: Unexpected error during auth check', error);
          // Clear stale session and tokens on any error
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          setIsAuthenticated(false);
          setIsInitialized(true);
          navigate('/');
        }
      }
    };

    // Automatically try again the exact moment the internet comes back
    const handleOnline = () => {
      logCore('[ADMIN INIT] Internet is back! Reloading session...');
      checkAuth();
    };

    window.addEventListener('online', handleOnline);

    checkAuth();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [navigate]);

    
  

  const loadData = async (showRefreshToast = false) => {
    setIsLoading(true);
    logCore('[MainAdmin] Starting data load...');
    logCore('[MainAdmin] Loading state set to true');

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      logError('[MainAdmin] Data load timed out after 30 seconds');
      setIsLoading(false);
      setIsRefreshing(false);
      toast({
        title: 'Error',
        description: 'Data load timed out. Please check your connection and try again.',
        variant: 'destructive'
      });
    }, 30000);
    
    try {
      logSupabase('[MainAdmin] Loading data from Supabase...');
      
      // Get current session for consistent auth
      const { data: sessionData } = await supabase.auth.getSession();
      logSupabase('[MainAdmin] Current session', sessionData.session ? 'Authenticated' : 'Not authenticated');
      
      // Test connection with cache-busting - wrapped in try/catch for timeout safety
      let connectionError = null;
      try {
        const connectionTest = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .abortSignal(AbortSignal.timeout(5000));
        connectionError = connectionTest.error;
      } catch (timeoutErr: any) {
        // Handle timeout gracefully - log as warning, don't break lifecycle
        logError('[MainAdmin] Connection test timed out (non-critical)', timeoutErr);
        connectionError = timeoutErr;
      }
        
      if (connectionError) {
        logError('[MainAdmin] Connection test failed', connectionError);
        setConnectionStatus('error');

        clearTimeout(timeoutId);
        setIsLoading(false);
        setIsRefreshing(false);
        logCore('[MainAdmin] Loading state reset due to connection error');
        toast({
          title: 'Connection Warning',
          description: 'Database connection slow or unavailable. Interface loaded in degraded mode.',
          variant: 'default'
        });
        return;
      }
      
      setConnectionStatus('connected');
      
      // Fetch users from Supabase with cache busting
      logSupabase('[MainAdmin] Fetching users from Supabase...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));
      
      logSupabase('[MainAdmin] Users fetch result', { 
        hasError: !!usersError, 
        errorMessage: usersError?.message,
        errorCode: usersError?.code,
        dataLength: usersData?.length,
        firstUser: usersData?.[0]?.email 
      });
      
      if (usersError) {
        logError('[MainAdmin] Users fetch error', usersError);
        toast({ 
          title: 'Error', 
          description: 'Failed to load users: ' + usersError.message,
          variant: 'destructive'
        });
      } else if (!usersData || usersData.length === 0) {
        logCore('[MainAdmin] No users returned from Supabase - this may indicate a connection or permissions issue');
        // Try one more time with a simpler query
        logSupabase('[MainAdmin] Retrying with count query...');
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        logSupabase('[MainAdmin] Count query result', { count, countError: countError?.message });
        
        if (count && count > 0) {
          // Users exist but we couldn't fetch them - likely an RLS or permissions issue
          toast({ 
            title: 'Warning', 
            description: `Database shows ${count} users but data could not be retrieved. This may be a permissions issue.`,
            variant: 'destructive'
          });
        }
        
        setUsers([]);
      } else {
        logSupabase('[MainAdmin] Loaded', `${usersData.length} users successfully`);
        // Process users with account status
        const processedUsers = usersData.map(user => ({
          ...user,
          account_status: user.is_frozen ? 'suspended' : 'active'
        }));
        setUsers(processedUsers);
      }
      
      // Fetch withdrawals from Supabase
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (withdrawalsError) {
        logError('[MainAdmin] Withdrawals fetch error', withdrawalsError);
      } else {
        logSupabase('[MainAdmin] Loaded', `${withdrawalsData?.length || 0} withdrawals`);
        // Enrich withdrawals with user data
        const enrichedWithdrawals = (withdrawalsData || []).map((w) => {
          const user = usersData?.find((u: RealUser) => u.id === w.user_id);
          return {
            ...w,
            user_email: user?.email || 'Unknown',
            user_name: user?.display_name || user?.email?.split('@')[0] || 'Unknown'
          };
        });
        setWithdrawals(enrichedWithdrawals);
      }
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const users = usersData || [];
      const withdrawals = withdrawalsData || [];
      
      setStats({
        totalUsers: users.length,
        totalPayouts: withdrawals.filter((w: RealWithdrawal) => w.status === 'completed').reduce((s: number, w: RealWithdrawal) => s + (w.amount || 0), 0),
        pendingPayouts: withdrawals.filter((w: RealWithdrawal) => w.status === 'pending').reduce((s: number, w: RealWithdrawal) => s + (w.amount || 0), 0),
        totalBalance: users.reduce((s: number, u: RealUser) => s + (u.balance || 0), 0),
        completedTasks: users.reduce((s: number, u: RealUser) => s + (u.tasks_completed || 0), 0),
        totalTasks: users.reduce((s: number, u: RealUser) => s + (u.tasks_total || 35), 0),
        activeToday: users.filter((u: RealUser) => u.last_login && u.last_login.startsWith(today)).length,
        pendingWithdrawals: withdrawals.filter((w: RealWithdrawal) => w.status === 'pending').length,
        newUsersToday: users.filter((u: RealUser) => u.created_at && u.created_at.startsWith(today)).length,
        totalEarnings: users.reduce((s: number, u: RealUser) => s + (u.total_earned || 0), 0),
        averageTasksPerUser: users.length > 0 ? users.reduce((s: number, u: RealUser) => s + (u.tasks_completed || 0), 0) / users.length : 0,
        topPerformers: users.filter((u: RealUser) => (u.tasks_completed || 0) > 30).length,
        flaggedAccounts: users.filter((u: RealUser) => u.user_status === 'flagged' || u.user_status === 'suspended' || u.is_frozen).length,
      });

      if (showRefreshToast && users.length > 0) {
        toast({
          title: 'Success',
          description: `Loaded ${users.length} users from Supabase`
        });
      }

      logCore('[MainAdmin] Data load completed successfully');

      // Send Telegram notification for admin session initialization (only on initial load, not refresh)
      if (!showRefreshToast && users.length > 0) {
        try {
          const { data: { user: adminUser } } = await supabase.auth.getUser();
          await sendTelegramNotification('ADMIN_ACTION', {
            action: 'ADMIN_PANEL_LOADED',
            admin: adminUser?.email || 'Admin',
            details: {
              usersLoaded: users.length,
              withdrawalsLoaded: withdrawalsData?.length || 0,
              totalBalance: stats.totalBalance,
              timestamp: new Date().toISOString()
            }
          });
          logTelegram('[MainAdmin] Telegram notification sent for admin panel load');
        } catch (telegramError) {
          logError('[MainAdmin] Failed to send Telegram notification', telegramError);
          // Don't block the app if Telegram notification fails
        }
      }
    } catch (err) {
      logError('[MainAdmin] Data load failed', err);
      toast({
        title: 'Error',
        description: 'Failed to load admin data: ' + (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsRefreshing(false);
      logCore('[MainAdmin] Loading state reset to false');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleLogout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    setProcessingIds(prev => new Set(prev).add(withdrawalId));
    try {
      // Use SupabaseService to approve withdrawal (includes balance update and transaction creation)
      const result = await SupabaseService.approveWithdrawal(withdrawalId,selectedUser?.id );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve withdrawal');
      }

      // Update local state
      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId ? { ...w, status: 'completed' as const, processed_at: new Date().toISOString() } : w
      ));

      toast({
        title: 'Withdrawal Approved',
        description: 'Withdrawal has been processed successfully and balance deducted',
      });
      
      // Refresh stats - commented out to prevent layout refresh and text field wipe
      // loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve withdrawal',
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

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    setProcessingIds(prev => new Set(prev).add(withdrawalId));
    try {
      // Use SupabaseService to reject withdrawal (includes transaction creation)
      const result = await SupabaseService.rejectWithdrawal(withdrawalId, selectedUser?.id, 'Rejected by admin');
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject withdrawal');
      }

      // Update local state
      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId ? { ...w, status: 'rejected' as const, processed_at: new Date().toISOString() } : w
      ));

      toast({
        title: 'Withdrawal Rejected',
        description: 'Withdrawal has been rejected successfully. Funds remain available to user.',
      });
      
      // Refresh stats - commented out to prevent layout refresh and text field wipe
      // loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject withdrawal',
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

  const handleFreezeUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin-user-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'freeze' })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to freeze user');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to freeze user');

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_frozen: true, account_status: 'suspended' as const } : u
      ));

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
    }
  };

  const handleUnfreezeUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin-user-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'unfreeze' })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to unfreeze user');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to unfreeze user');

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_frozen: false, account_status: 'active' as const } : u
      ));

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
    }
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) return;

    try {
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid positive number',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/admin-user-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: balanceAction,
          amount,
          reason: balanceReason
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update balance');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to update balance');

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, balance: result.newBalance } : u
      ));

      toast({
        title: 'Balance Updated',
        description: `Successfully ${balanceAction === 'add' ? 'added' : 'reduced'} $${amount}`,
      });

      // Close modal and reset form
      setBalanceModalOpen(false);
      setBalanceAmount('');
      setBalanceReason('');
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update balance',
        variant: 'destructive',
      });
    }
  };

  const handleVipUpdate = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin-user-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          vipLevel: newVipLevel
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update VIP level');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to update VIP level');

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, vip_level: result.newVipLevel } : u
      ));

      toast({
        title: 'VIP Level Updated',
        description: `Updated from VIP${result.previousVipLevel} to VIP${result.newVipLevel}`,
      });

      // Close modal
      setVipModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update VIP level',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin-user-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete user');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to delete user');

      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));

      toast({
        title: 'User Deleted',
        description: 'User has been soft deleted successfully',
      });

      // Close modal
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // Pending Orders Functions
  const loadPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('has_pending_order', true)
        .order('created_at', { ascending: false });

      if (error) {
        logError('Error fetching pending orders', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending orders',
          variant: 'destructive'
        });
        return;
      }

      setPendingOrderUsers(data || []);
    } catch (error) {
      logError('Exception loading pending orders', error);
    }
  };

  const handleClearPendingOrder = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      // Get current admin user ID
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (!adminUser) {
        toast({
          title: 'Error',
          description: 'Admin authentication required',
          variant: 'destructive'
        });
        return;
      }

      // Call the admin function to clear pending order and add 6× profit
      const { data, error } = await supabase.rpc('admin_clear_pending_order', {
        p_admin_id: adminUser.id,
        p_user_id: userId
      });

      if (error) {
        logError('Error clearing pending order', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to clear pending order',
          variant: 'destructive'
        });
        return;
      }

      const result = data as { success: boolean; profit?: number; error?: string };
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Cleared pending order and added $${(result.profit ?? 0).toFixed(2)} (6× profit)`,
        });
        
        // Get user details for Telegram notification
        const user = pendingOrderUsers.find(u => u.id === userId);
        const pendingAmount = user ? (user as any).pending_amount || 0 : 0;
        const profit = result.profit || pendingAmount * 6;
        
        // Send Telegram notification
        await sendTelegramNotification('PENDING_ORDER_CLEARED', {
          userEmail: user?.email || 'Unknown',
          userId: userId,
          pendingAmount: (pendingAmount ?? 0).toFixed(2),
          profit: (profit ?? 0).toFixed(2),
          totalCredit: ((pendingAmount ?? 0) + (profit ?? 0)).toFixed(2),
          adminEmail: adminUser.email || 'Admin'
        });
        
        // Remove user from list
        setPendingOrderUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to clear pending order',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      logError('Exception clearing pending order', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear pending order',
        variant: 'destructive'
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Calculate 6× profit
  const calculate6xProfit = (pendingAmount: number) => {
    return pendingAmount * 6;
  };

  // Filter pending order users based on search
  const filteredPendingUsers = pendingOrderSearch
    ? pendingOrderUsers.filter(user =>
        user.email.toLowerCase().includes(pendingOrderSearch.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(pendingOrderSearch.toLowerCase())
      )
    : pendingOrderUsers;

  // Block render until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 backdrop-blur-xl flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 animate-pulse">
            <Shield size={32} className="text-white" />
          </div>
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after initialization, redirect happens in useEffect
  if (!isAuthenticated) {
    return null;
  }

   return (
    <div className="min-h-screen bg-slate-950 text-slate-100 backdrop-blur-xl">
      {/* Header */}
      <AdBanner />
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
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
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 text-[10px] border ${
                      connectionStatus === 'connected' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : connectionStatus === 'error'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {connectionStatus === 'connected' ? '● LIVE' : connectionStatus === 'error' ? '● ERROR' : '● OFFLINE'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
              >
                <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <LogIn size={14} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#0a0e1a]/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
              { id: 'pending-orders', label: 'Pending Orders', icon: AlertTriangle },
              // { id: 'customer-service', label: 'Customer Service', icon: Headphones },
              // { id: 'product-catalog', label: 'Product Catalog', icon: ShoppingBag },
              { id: 'admin-controls', label: 'Admin Controls', icon: Settings },
              { id: 'create-account', label: 'Create Account', icon: UserPlus },
              { id: 'password-reset', label: 'Password Reset', icon: Key },
              // { id: 'ai-assistant', label: "KANSAS NELLY'S AI", icon: Sparkles, external: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && activeTab !== 'customer-service' && activeTab !== 'admin-controls' && activeTab !== 'create-account' && activeTab !== 'product-catalog' ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading admin dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">Platform Overview</h2>
                  <p className="text-sm text-gray-500">Real-time statistics and platform health metrics</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Total Users</p>
                          <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                          <p className="text-xs text-slate-400">
                            <span className="text-green-400">+{stats.newUsersToday}</span> today
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Total Balance</p>
                          <p className="text-2xl font-bold text-white">${(stats.totalBalance ?? 0).toFixed(2)}</p>
                          <p className="text-xs text-slate-400">Across all users</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Pending Withdrawals</p>
                          <p className="text-2xl font-bold text-white">${(stats.pendingPayouts ?? 0).toFixed(2)}</p>
                          <p className="text-xs text-slate-400">{stats.pendingWithdrawals} requests</p>
                        </div>
                        <Activity className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Completed Tasks</p>
                          <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
                          <p className="text-xs text-slate-400">
                            {(stats.averageTasksPerUser ?? 0).toFixed(1)} avg per user
                          </p>
                        </div>
                        <RefreshCw className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Engine Dashboard */}
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-4">Seven-Engine Monetization Matrix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Network Traffic Desk */}
                    <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                          <span className="text-2xl mr-2">📱</span>
                          Network Traffic Desk
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-400">Total App Installs</p>
                            <p className="text-2xl font-bold text-white">{revenueStats.totalAppInstalls.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Android: {revenueStats.androidInstalls} | iOS: {revenueStats.iosInstalls}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">NellyCoins Minted</p>
                            <p className="text-2xl font-bold text-amber-400">+{revenueStats.nellyCoinsFromInstalls.toLocaleString()} 🪙</p>
                            <p className="text-xs text-slate-500">+10 coins per install</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 2: Ads & Subscription Yield */}
                    <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                          <span className="text-2xl mr-2">💰</span>
                          Ads & Subscription Yield
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-400">Ad Revenue (USD)</p>
                            <p className="text-2xl font-bold text-green-400">${revenueStats.adRevenueUSD.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">eCPM: ${revenueStats.adECPM.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Active VIP Subscriptions</p>
                            <p className="text-2xl font-bold text-purple-400">{revenueStats.activeVIPSubscriptions.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">${revenueStats.vipRevenueUSD.toLocaleString()} monthly</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 3: Platform Tax Engine */}
                    <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                          <span className="text-2xl mr-2">⚡</span>
                          Platform Tax Engine
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-400">Withdrawal Fees</p>
                            <p className="text-2xl font-bold text-orange-400">${revenueStats.withdrawalFeesUSD.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Priority processing</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Task Tax & B2B Commissions</p>
                            <p className="text-2xl font-bold text-blue-400">${revenueStats.taskTaxUSD.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Sponsored matching</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Module 3: Monetization Analytics - Download & Device Tracking */}
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent mb-4">Download & Device Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                          <span className="text-2xl mr-2">📱</span>
                          Total Mobile Installs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-400">Total Downloads</p>
                            <p className="text-2xl font-bold text-white">{revenueStats.totalAppInstalls.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">+{revenueStats.nellyCoinsFromInstalls.toLocaleString()} NellyCoins awarded</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Bonus Conversion Rate</p>
                            <p className="text-2xl font-bold text-green-400">{revenueStats.totalAppInstalls > 0 ? ((revenueStats.nellyCoinsFromInstalls / revenueStats.totalAppInstalls) * 10).toFixed(1) : '0.0'}%</p>
                            <p className="text-xs text-slate-500">Install-to-bonus ratio</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                          <span className="text-2xl mr-2">📊</span>
                          Device Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-400">Android Devices</p>
                            <p className="text-2xl font-bold text-green-400">{revenueStats.androidInstalls.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{revenueStats.totalAppInstalls > 0 ? ((revenueStats.androidInstalls / revenueStats.totalAppInstalls) * 100).toFixed(1) : '0.0'}% of total</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">iOS Devices</p>
                            <p className="text-2xl font-bold text-blue-400">{revenueStats.iosInstalls.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{revenueStats.totalAppInstalls > 0 ? ((revenueStats.iosInstalls / revenueStats.totalAppInstalls) * 100).toFixed(1) : '0.0'}% of total</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                          <span className="text-2xl mr-2">⚡</span>
                          Task Completion Speed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-400">Average Completion Time</p>
                            <p className="text-2xl font-bold text-purple-400">2.5h</p>
                            <p className="text-xs text-slate-500">Per 45-task cycle</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Active Training Accounts</p>
                            <p className="text-2xl font-bold text-amber-400">{stats.activeToday.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Currently in progress</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Users */}
                  <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <CardHeader>
                      <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Recent Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{(user.display_name || user.email || 'U').charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{user.display_name || user.email?.split('@')[0] || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                            <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                              {user.account_status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pending Withdrawals */}
                  <Card className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <CardHeader>
                      <CardTitle className="bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent flex items-center text-lg">
                        <ArrowDownToLine className="w-5 h-5 mr-2 text-green-500" />
                        Pending Withdrawals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(w => (
                          <div key={w.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{w.user_name}</p>
                              <p className="text-xs text-slate-400 font-mono truncate max-w-[160px]">{w.wallet_address}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-amber-400">${(w.amount ?? 0).toFixed(2)}</p>
                              <p className="text-xs text-slate-500">{new Date(w.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                        {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                            <Activity size={24} className="mx-auto mb-2 opacity-50" />
                            <p>No pending withdrawals</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <>
                {logCore('[MainAdmin] Rendering USERS tab, users count', users.length)}
                <AdminUsers onLogout={handleLogout} />
              </>
            )}

            {/* OLD Users Tab - DISABLED, using AdminUsers component instead */}
            {false && activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">User Management</h2>
                    <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {users.length} Total Users
                  </Badge>
                </div>

                <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">VIP</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tasks</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-white">{user.display_name || user.email?.split('@')[0]}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={user.account_type === 'training' ? 'secondary' : 'default'}>
                                {user.account_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-white">VIP{user.vip_level}</span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-emerald-400">${(user.balance ?? 0).toFixed(2) || '0.00'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-white">{user.tasks_completed || 0}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={user.is_frozen ? 'destructive' : 'default'}>
                                {user.is_frozen ? 'Frozen' : 'Active'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBalanceAction('add');
                                    setBalanceModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 transition-colors"
                                  title="Add Balance"
                                >
                                  ➕
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBalanceAction('reduce');
                                    setBalanceModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs hover:bg-orange-500/30 transition-colors"
                                  title="Reduce Balance"
                                >
                                  ➖
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setNewVipLevel(user.vip_level);
                                    setVipModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors"
                                  title="Set VIP Level"
                                >
                                  👑
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserDetailsModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                                  title="View Details"
                                >
                                  👁
                                </button>
                                {user.is_frozen ? (
                                  <button
                                    onClick={() => handleUnfreezeUser(user.id)}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                                    title="Unfreeze"
                                  >
                                    ❄
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleFreezeUser(user.id)}
                                    className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs hover:bg-cyan-500/30 transition-colors"
                                    title="Freeze"
                                  >
                                    ❄
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                                  title="Delete User"
                                >
                                  🗑
                                </button>
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

            {/* OLD User Modals - DISABLED, using AdminUsers component instead */}
            {false && <>
            {/* Balance Management Modal */}
            {balanceModalOpen && selectedUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {balanceAction === 'add' ? 'Add Balance' : 'Reduce Balance'}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    User: {selectedUser.display_name || selectedUser.email}
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
                    Current Balance: ${(selectedUser.balance ?? 0).toFixed(2) || '0.00'}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (USD)</label>
                      <input
                        type="number"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Reason</label>
                      <input
                        type="text"
                        value={balanceReason}
                        onChange={(e) => setBalanceReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter reason (optional)"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleBalanceUpdate}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {balanceAction === 'add' ? 'Add' : 'Reduce'}
                      </button>
                      <button
                        onClick={() => {
                          setBalanceModalOpen(false);
                          setBalanceAmount('');
                          setBalanceReason('');
                          setSelectedUser(null);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIP Level Modal */}
            {vipModalOpen && selectedUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Set VIP Level</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    User: {selectedUser.display_name || selectedUser.email}
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
                    Current VIP: VIP{selectedUser.vip_level}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">VIP Level</label>
                      <select
                        value={newVipLevel}
                        onChange={(e) => setNewVipLevel(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>VIP1 Bronze</option>
                        <option value={2}>VIP2 Silver</option>
                        <option value={3}>VIP3 Gold</option>
                        <option value={4}>VIP4 Platinum</option>
                        <option value={5}>VIP5 Diamond</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleVipUpdate}
                        className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Update VIP
                      </button>
                      <button
                        onClick={() => {
                          setVipModalOpen(false);
                          setSelectedUser(null);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Details Modal */}
            {userDetailsModalOpen && selectedUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
                  <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                                <p className="text-sm text-white">{selectedUser.display_name || 'N/A'}</p>
                              </div>
                              <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                        <p className="text-sm text-white">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Balance</label>
                                <p className="text-sm text-emerald-400">${selectedUser.balance?.toFixed(2) || '0.00'}</p>
                              </div>
                              <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">VIP Level</label>
                        <p className="text-sm text-white">VIP{selectedUser.vip_level}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Account Type</label>
                        <p className="text-sm text-white">{selectedUser.account_type}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                        <p className={`text-sm ${selectedUser.is_frozen ? 'text-red-400' : 'text-green-400'}`}>
                          {selectedUser.is_frozen ? 'Frozen' : 'Active'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Tasks Completed</label>
                                <p className="text-sm text-white">{selectedUser.tasks_completed || 0}</p>
                              </div>
                              <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Total Earned</label>
                                <p className="text-sm text-white">${selectedUser.total_earned?.toFixed(2) || '0.00'}</p>
                              </div>
                            </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Created Date</label>
                      <p className="text-sm text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setUserDetailsModalOpen(false);
                          setSelectedUser(null);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && selectedUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Delete User</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Are you sure you want to delete this user?
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-white">{selectedUser.display_name || selectedUser.email}</p>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                  <p className="text-xs text-orange-400 mb-4">
                    This will soft delete the user. They will be marked as deleted but data will be preserved.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteUser}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmOpen(false);
                        setSelectedUser(null);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">Withdrawal Management</h2>
                    <p className="text-sm text-gray-500">Process and manage withdrawal requests</p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                    {withdrawals.filter(w => w.status === 'pending').length} Pending
                  </Badge>
                </div>

                <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Wallet</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-white">{w.user_name}</p>
                                <p className="text-xs text-slate-400">{w.user_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm font-bold text-white">${(w.amount ?? 0).toFixed(2)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-400 font-mono truncate max-w-[120px]">{w.wallet_address}</p>
                              <p className="text-xs text-slate-500">{w.wallet_type}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={
                                  w.status === 'completed' ? 'default' : 
                                  w.status === 'pending' ? 'secondary' : 
                                  'destructive'
                                }
                                className={
                                  w.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }
                              >
                                {w.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              {w.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleApproveWithdrawal(w.id)}
                                    disabled={processingIds.has(w.id)}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                  >
                                    {processingIds.has(w.id) ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectWithdrawal(w.id)}
                                    disabled={processingIds.has(w.id)}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Orders Tab - ENHANCED with tracking */}
            {activeTab === 'pending-orders' && (
              <EnhancedPendingOrdersManager />
            )}

            {/* Customer Service Tab */}
            {activeTab === 'customer-service' && (
              <div className="h-[calc(100vh-180px)] -mx-4 -my-8">
                <AdminCustomerService />
              </div>
            )}

            {/* Product Catalog Tab - Uses Supabase training_products/personal_products tables */}
            {activeTab === 'product-catalog' && (
              <ProductCatalogManager />
            )}

            {/* Admin Controls Tab */}
            {activeTab === 'admin-controls' && (
              <AdminControls onRefresh={loadData} />
            )}

            {/* Create Account Tab */}
            {activeTab === 'create-account' && (
              <AccountCreation onAccountCreated={loadData} />
            )}

            {/* Password Reset Tab */}
            {activeTab === 'password-reset' && (
              <AdminPasswordReset />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MainAdminPanel;
