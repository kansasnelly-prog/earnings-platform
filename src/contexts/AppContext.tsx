import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import SupabaseService, { DatabaseUser, DatabaseTask, DatabaseTransaction, Phase2Checkpoint } from '@/services/supabaseService';
import ProductCatalogService from '@/services/productCatalogService';
import { toast } from '@/components/ui/use-toast';
import { sendTelegramNotification } from '@/utils/telegramHelper';
import { getDeviceInfo } from '@/utils/deviceDetection';
import { TelegramService } from '@/services/telegramService';

// ===========================================
// TYPES
// ===========================================

export interface User {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  vip_level: 1 | 2 | 3;
  balance: number;
  total_earned: number;
  referral_code: string;
  created_at: string;
  account_type: 'training' | 'personal' | 'admin';
  training_completed: boolean;
  training_progress: number;
  user_status: 'registered' | 'waiting_for_training' | 'training_assigned' | 'training_credentials_sent' | 'training_completed' | 'active';
  training_account_email?: string;
  personal_account_id?: string;
  training_phase: 1 | 2;
  tasks_completed: number;
  total_tasks: number;
  task_number?: number;
  current_task_set?: number;
  set_1_completed_at?: string | null;
  set_2_completed_at?: string | null;
  trigger_task_number: 19 | 24 | 31 | 32 | null;
  has_pending_order: boolean;
  pending_amount: number;
  is_negative_balance: boolean;
  profit_added: boolean;
  pending_product?: {
    name: string;
    brand: string;
    price: number;
    category: string;
    image: string;
  };
  phase2_checkpoint?: Phase2Checkpoint | null;
  has_pending_checkpoint?: boolean;
  is_training_account: boolean;
  // VIP1 lock mechanism fields
  tasks_locked: boolean;
  linked_training_account_id: string | null;
  // Phase 2 tracking fields
  training_phase_2_checkpoint: any;
  training_completed_v2: boolean;
  commission_transferred: boolean;
  commission_transfer_amount: number;
  commission_transferred_at: string | null;
  training_phase_1_locked: boolean;
  training_phase_1_locked_at: string | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  image: string;
}
export interface Task {
  id: string;
  user_id: string;
  task_number: number;
  title: string;
  description: string;
  reward: number;
  status: 'pending' | 'completed' | 'locked';
  created_at: string;
  completed_at: string | null;
  task_set: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  is_primary: boolean;
  created_at: string;
  
  // Balance tracking
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'reward' | 'withdrawal' | 'demo' | 'pending' | 'profit' | 
        'task_reward' | 'withdrawal_request' | 'withdrawal_completed' | 'withdrawal_rejected' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
  
  // Reference fields
  reference_id?: string;
  reference_type?: 'task' | 'withdrawal' | 'bonus';
}

export interface TaskHistory {
  id: string;
  task_number: number;
  product_name: string;
  reward: number;
  completed_at: string;
}

export interface WalletState {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  transactions: Transaction[];
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: 'bank_transfer' | 'crypto' | 'other';
  account_details: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface AppContextType {
  user: User | null;
  tasks: Task[];
  transactions: Transaction[];
  wallets: Wallet[];
  taskHistory: TaskHistory[];
  walletState: WalletState;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Auth Modal UI State
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  
  // Auth
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginTrainingAccount: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Tasks
  completeTask: (taskNumber: number) => Promise<{ success: boolean; reward?: number }>;
  refreshTasks: () => Promise<void>;
  
  // User
  refreshUser: () => Promise<void>;
  refreshApp: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  
  // Pending Order
  createPendingOrder: (taskNumber: number, amount: number, product: any) => Promise<boolean>;
  clearPendingOrderAndClaimProfit: () => Promise<{ success: boolean; profit?: number; error?: string }>;
  
  // Data
  refreshTransactions: () => Promise<void>;
  addWallet: (walletAddress: string, walletType: string) => Promise<boolean>;
  refreshWallets: () => Promise<void>;
  
  // Withdrawals
  requestWithdrawal: (amount: number, walletAddress: string, walletType: string) => Promise<{ success: boolean; error?: string }>;
  getWithdrawalHistory: () => Promise<any[]>;
  hasPendingWithdrawal: () => Promise<boolean>;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function mapDatabaseUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    phone: dbUser.phone || null,
    display_name: dbUser.display_name,
    vip_level: (dbUser.vip_level || 1) as 1 | 2 | 3,
    balance: dbUser.balance || 0,
    total_earned: dbUser.total_earned || 0,
    referral_code: dbUser.referral_code || '',
    created_at: dbUser.created_at,
    account_type: (dbUser.account_type || 'personal') as 'training' | 'personal' | 'admin',
    training_completed: dbUser.training_completed || false,
    training_progress: dbUser.training_progress || 0,
    user_status: 'active' as User['user_status'],
    training_phase: (dbUser.training_phase || 1) as 1 | 2,
    tasks_completed: dbUser.tasks_completed || 0,
    total_tasks: dbUser.total_tasks || (dbUser.account_type === 'training' ? 45 : 35),
    task_number: dbUser.task_number || 1,
    current_task_set: dbUser.current_task_set || 1,
    set_1_completed_at: dbUser.set_1_completed_at || null,
    set_2_completed_at: dbUser.set_2_completed_at || null,
    trigger_task_number: dbUser.trigger_task_number as 19 | 24 | 31 | 32 | null,
    has_pending_order: dbUser.has_pending_order || false,
    pending_amount: dbUser.pending_amount || 0,
    is_negative_balance: dbUser.is_negative_balance || false,
    profit_added: dbUser.profit_added || false,
    pending_product: dbUser.pending_product ? {
      name: dbUser.pending_product.name || 'Product',
      brand: 'Premium Brand',
      price: dbUser.pending_product.price1 || 0,
      category: 'Electronics',
      image: dbUser.pending_product.image1 || ''
    } : undefined,
    is_training_account: dbUser.account_type === 'training',
    // VIP1 lock mechanism fields
    tasks_locked: (dbUser as any).tasks_locked || false,
    linked_training_account_id: (dbUser as any).linked_training_account_id || null,
    // Phase 2 tracking fields
    training_phase_2_checkpoint: (dbUser as any).training_phase_2_checkpoint || null,
    training_completed_v2: (dbUser as any).training_completed_v2 || false,
    commission_transferred: (dbUser as any).commission_transferred || false,
    commission_transfer_amount: (dbUser as any).commission_transfer_amount || 0,
    commission_transferred_at: (dbUser as any).commission_transferred_at || null,
    training_phase_1_locked: (dbUser as any).training_phase_1_locked || false,
    training_phase_1_locked_at: (dbUser as any).training_phase_1_locked_at || null,
  };
}

function mapDatabaseTaskToTask(dbTask: DatabaseTask): Task {
  return {
    id: dbTask.id,
    user_id: dbTask.user_id,
    task_number: dbTask.task_number,
    title: dbTask.product_name || `Task ${dbTask.task_number}`,
    description: `Complete task ${dbTask.task_number}`,
    reward: dbTask.reward || 0,
    status: dbTask.status || 'locked',
    created_at: dbTask.created_at,
    completed_at: dbTask.completed_at || null,
    task_set: 0
  };
}

function mapDatabaseTransactionToTransaction(dbTx: DatabaseTransaction): Transaction {
  const typeMap: Record<string, Transaction['type']> = {
    'deposit': 'deposit',
    'earning': 'reward',
    'withdrawal': 'withdrawal',
    'task_reward': 'reward',
    'combination_order': 'pending',
    'profit_claim': 'profit'
  };
  
  return {
    id: dbTx.id,
    user_id: dbTx.user_id,
    type: typeMap[dbTx.type] || 'reward',
    amount: Math.abs(dbTx.amount),
    status: dbTx.status,
    description: dbTx.description,
    created_at: dbTx.created_at
  };
}

// ===========================================
// CONTEXT CREATION
// ===========================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [walletState, setWalletState] = useState<WalletState>({
    available_balance: 0,
    pending_balance: 0,
    total_earned: 0,
    total_withdrawn: 0,
    transactions: []
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const isCheckingAuth = useRef(false);
  const isRefreshingTasks = useRef(false);
  const lastRefreshTime = useRef<number>(0);
  const lastActivityTime = useRef<number>(Date.now());
  const isCheckingSessionRecovery = useRef(false);
  const isRefreshingApp = useRef(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth Modal UI State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // ===========================================
  // INITIAL LOAD - Check Session
  // ===========================================
  
  useEffect(() => {
    const checkSession = async () => {
      // Skip auth check on admin route - admin uses localStorage-based auth
      if (window.location.pathname.startsWith('/admin')) {
        console.log('[checkSession] Skipping auth check on /admin route');
        return;
      }

      // Prevent concurrent auth checks
      if (isCheckingAuth.current) {
        console.log('[checkSession] Auth check already in progress, skipping...');
        return;
      }

      isCheckingAuth.current = true;
      setIsLoading(true);
      try {
        // Check if browser is online before making network request
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[checkSession] Skipping session check - Browser is offline');
          return;
        }

        // First, restore Supabase session from storage
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[checkSession] Supabase session restored:', session ? 'Active' : 'None');
        if (sessionError) {
          throw sessionError;
        }

        // Only treat as logged out if session is explicitly null (not just an error)
        if (session === null) {
          console.log('[checkSession] No session found, user is logged out');
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        const dbUser = await SupabaseService.getCurrentUser();

        if (dbUser) {
          setUser(mapDatabaseUserToUser(dbUser));
          setIsAuthenticated(true);

          // Load user data
          await loadUserData(dbUser.id, dbUser.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
          console.log('[checkSession] Network connection interrupted. Waiting for network recovery...');
        } else {
          console.error('Error checking session:', error);
          // Don't auto-logout on error - just log it
        }
      } finally {
        setIsLoading(false);
        isCheckingAuth.current = false;
      }
    };

    checkSession();

    // Subscribe to auth changes with network guard
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip auth state changes on admin route - admin uses localStorage-based auth
      if (window.location.pathname.startsWith('/admin')) {
        console.log('[Auth State Change] Skipping on /admin route');
        return;
      }

      console.log('[Auth State Change] Event:', event);
      console.log('[Auth State Change] Session:', session ? 'Active' : 'None');

      // Skip if we're already checking auth (prevent concurrent operations)
      if (isCheckingAuth.current) {
        console.log('[authStateChange] Auth check in progress, skipping...');
        return;
      }

      // Check if browser is online before processing auth state change
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('[Auth State Change] Skipping - Browser is offline');
        return;
      }

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          isCheckingAuth.current = true;

          const dbUser = await SupabaseService.getUserById(session.user.id);
          if (dbUser) {
            setUser(mapDatabaseUserToUser(dbUser));
            setIsAuthenticated(true);
            await loadUserData(dbUser.id, dbUser.email);

            // Send Telegram login notification
            TelegramService.sendLoginNotification(dbUser.email, dbUser.display_name).catch(err => {
              console.error('[Auth State Change] Failed to send login notification:', err);
            });

            // Check and transfer commission from completed training accounts (only for personal accounts)
            if (dbUser.account_type === 'personal') {
              console.log('[Transfer] checkAndTransferCommission started for user:', dbUser.id);
              const transferResult = await SupabaseService.checkAndTransferCommission(dbUser.id);
              console.log('[Transfer] transfer result:', transferResult);

              if (transferResult.success && transferResult.transferred) {
                console.log('[Transfer] transfer success - amount:', transferResult.amount);
                toast({
                  title: 'Training completed successfully!',
                  description: `$${transferResult.amount?.toFixed(2)} has been transferred to your personal account. Your account is now fully activated.`,
                  variant: 'default',
                });

                // Refresh user data to show updated balance
                await loadUserData(dbUser.id, dbUser.email);
              } else {
                console.log('[Transfer] no transfer executed - result:', transferResult);
              }
            }
          }
          isCheckingAuth.current = false;
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth State Change] User signed out');
          setUser(null);
          setIsAuthenticated(false);
          setTasks([]);
          setTransactions([]);
          setWallets([]);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth State Change] Token refreshed successfully');
        }
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
          console.log('[Auth State Change] Network connection interrupted. Waiting for network recovery...');
        } else {
          console.error('[Auth State Change] Error:', error);
        }
        isCheckingAuth.current = false;
      }
    });

    // Automatically retry session check when connection is restored
    const handleOnline = () => {
      console.log('[AppContext] Network connection restored. Refreshing session...');
      checkSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }
    
    // Listen for checkpoint refresh events from TaskGrid realtime subscription
    const handleCheckpointRefresh = async (event: any) => {
      console.log('[AppContext] Checkpoint refresh event received:', event.detail);
      if (user?.id) {
        console.log('[AppContext] Refreshing user data after checkpoint update');
        await refreshUser();
      }
    };
    window.addEventListener('refresh_user_checkpoint', handleCheckpointRefresh);

    // Handle tab visibility change - auto-refresh when user returns to inactive tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user) {
        console.log('[AppContext] Tab became visible, refreshing app state...');
        // Only refresh if tab was hidden for more than 30 seconds to avoid unnecessary refreshes
        const lastHiddenTime = sessionStorage.getItem('lastTabHiddenTime');
        if (lastHiddenTime) {
          const hiddenDuration = Date.now() - parseInt(lastHiddenTime);
          if (hiddenDuration > 30000) { // 30 seconds
            console.log('[AppContext] Tab was hidden for', hiddenDuration / 1000, 'seconds, triggering refresh');
            await refreshApp();
          }
          sessionStorage.removeItem('lastTabHiddenTime');
        }
      } else if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('lastTabHiddenTime', Date.now().toString());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto session recovery - periodically validate session and refresh if stale
    const sessionRecoveryInterval = setInterval(async () => {
      // Skip if already checking session (prevent concurrent reads causing lock contention)
      if (!isAuthenticated || !user || isCheckingSessionRecovery.current) return;

      isCheckingSessionRecovery.current = true;

      try {
        // Check if session is still valid
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.log('[AppContext] Session invalid during recovery check, signing out');
          await logout();
          return;
        }

        // Check if session is stale (older than 5 minutes since last activity)
        const now = Date.now();
        const inactiveTime = now - lastActivityTime.current;
        if (inactiveTime > 300000) { // 5 minutes of inactivity
          console.log('[AppContext] Session stale due to inactivity, refreshing...');
          await refreshApp();
          lastActivityTime.current = now;
        }
      } catch (err) {
        console.error('[AppContext] Session recovery check failed:', err);
      } finally {
        isCheckingSessionRecovery.current = false;
      }
    }, 60000); // Check every minute

    // Track user activity to prevent unnecessary refreshes
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
      localStorage.setItem('lastActivityTime', lastActivityTime.current.toString());
    };

    // Add activity event listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('refresh_user_checkpoint', handleCheckpointRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
      clearInterval(sessionRecoveryInterval);
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Refresh tasks when user changes to ensure tasks are loaded for new accounts
  useEffect(() => {
    if (user && isAuthenticated) {
      console.log('[AppContext] User changed, refreshing tasks for:', user.id, 'account_type:', user.account_type);
      refreshTasks().catch(err => console.error('[AppContext] refreshTasks failed:', err));
    }
  }, [user?.id, user?.account_type, isAuthenticated]);

  const loadUserData = async (userId: string, email?: string) => {
    console.log('[loadUserData] Starting loadUserData - userId:', userId);

    // ALWAYS fetch user from public.users first to get account_type
    let dbUser = null;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('[loadUserData] Error fetching user from public.users:', userError);
        return;
      }

      if (!userData) {
        console.error('[loadUserData] User not found in public.users');
        return;
      }

      console.log('[loadUserData] Loaded user from public.users - account_type:', userData.account_type);
      dbUser = userData;
    } catch (error) {
      console.error('[loadUserData] Exception fetching user from public.users:', error);
      return;
    }

    // Check if training is completed - if so, skip ALL localStorage wallet loading and use Supabase only
    const isTrainingCompleted = dbUser.training_completed === true || dbUser.training_completed_v2 === true;
    const isTraining = dbUser.account_type === 'training';

    if (isTrainingCompleted && isTraining) {
      console.log('[loadUserData] Training completed - skipping ALL localStorage wallet loading, using Supabase only');
      // Clear any localStorage wallet data for completed training
      const userEmail = dbUser.email || email;
      const emailKey = userEmail?.toLowerCase();
      if (emailKey) {
        localStorage.removeItem(`training_wallet_${emailKey}`);
      }

      // Set wallet state directly from Supabase data
      const completedWallet: WalletState = {
        available_balance: dbUser.balance,
        total_earned: dbUser.total_earned,
        pending_balance: 0,
        total_withdrawn: 0,
        transactions: []
      };
      setWalletState(completedWallet);
      console.log('[loadUserData] Set walletState for completed training from Supabase:', completedWallet);

      // Update user state
      setUser(prev => prev ? {
        ...prev,
        balance: dbUser.balance,
        total_earned: dbUser.total_earned,
      } : null);

      return; // EARLY RETURN - skip all localStorage logic
    }

    // Add null checks with fallback values for VIP1
    const vipLevel = dbUser.vip_level || 1;
    const currentTaskSet = dbUser.current_task_set || 1;
    const totalTasks = dbUser.total_tasks || 45; // Default to 45 for training, database should provide this
    const taskNumber = dbUser.task_number || 1;

    console.log('[loadUserData] Null checks applied - vipLevel:', vipLevel, 'currentTaskSet:', currentTaskSet, 'totalTasks:', totalTasks, 'taskNumber:', taskNumber);

    // Set accountType from the fetched user
    const actualAccountType = dbUser.account_type as 'training' | 'personal' | 'admin';
    const userEmail = dbUser.email || email;

    console.log('[loadUserData] accountType from DB:', actualAccountType, 'isTraining:', isTraining, 'userEmail:', userEmail);

    // For training accounts, fetch from training_accounts table directly
    if (isTraining && userId) {
      try {
        console.log('[loadUserData] Fetching training account data for user ID:', userId);

        // Fetch training account data from Supabase using auth_user_id
        const { data: trainingAccount, error: trainingError } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('auth_user_id', userId)
          .single();

        console.log('[DEBUG] Training account data:', trainingAccount);

        if (trainingAccount && !trainingError) {
          console.log('[loadUserData] Training account found:', trainingAccount);

          // Use users.balance for total balance (includes initial + earned), but total_earned should only be earned rewards
          const trainingTaskNumber = trainingAccount.task_number || 1; // Next task to complete
          const completedTasks = Math.max(0, trainingTaskNumber - 1);
          const earnedRewards = trainingAccount.amount || 0; // Only earned rewards, not including initial capital

          console.log('[loadUserData] Training data from DB - Balance from users table:', dbUser.balance, 'Earned rewards:', earnedRewards, 'Next task:', trainingTaskNumber, 'Completed:', completedTasks);

          // Update user state with training account data
          setUser(prev => prev ? {
            ...prev,
            balance: dbUser.balance, // Use balance from users table (includes initial + earned)
            tasks_completed: completedTasks, // Calculate from task_number
            task_number: trainingTaskNumber, // Next task to complete
            total_earned: earnedRewards, // Use only earned rewards from training_accounts.amount
            is_training_account: true,
          } : null);

          // Update wallet state with training account balance
          const trainingWallet: WalletState = {
            available_balance: dbUser.balance, // Use balance from users table (includes initial + earned)
            pending_balance: 0,
            total_earned: earnedRewards, // Use only earned rewards from training_accounts.amount
            total_withdrawn: 0,
            transactions: []
          };
          setWalletState(trainingWallet);
          console.log('[loadUserData] Set walletState for training account:', trainingWallet);

          // Tasks will be loaded by refreshTasks using Supabase task_number as source of truth
          // Don't set tasks here to avoid stale data - refreshTasks will handle it
          console.log('[loadUserData] Skipping task creation - refreshTasks will rebuild from Supabase task_number');
          
          // Check for Phase 2 checkpoint - ONLY in Phase 2
          // Use getAnyPhase2Checkpoint to find ANY existing checkpoint (regardless of task_number)
          // This prevents duplicate checkpoint creation at different task numbers
          // AND ensures we know if checkpoint was already processed even when past task 31/32
          const isPhase2 = Number(dbUser?.training_phase) === 2;
          if (isPhase2) {
            console.log('[Checkpoint] loadUserData - Phase 2 detected, checking for ANY existing checkpoint');
            const checkpoint = await SupabaseService.getAnyPhase2Checkpoint(userId);
            if (checkpoint) {
              console.log('[Checkpoint] loadUserData - Found checkpoint:', checkpoint.id, 'status:', checkpoint.status, 'created_at_task:', checkpoint.task_number);
              
              // If checkpoint already processed, don't show modal again
              if (checkpoint.status === 'completed' || checkpoint.status === 'bonus_paid' || checkpoint.status === 'submitted') {
                console.log('[Checkpoint] loadUserData - Checkpoint already processed - hiding modal');
                setUser(prev => prev ? {
                  ...prev,
                  phase2_checkpoint: null,
                  has_pending_checkpoint: false
                } : null);
              } else if (checkpoint.status === 'pending_review') {
                console.log('[Checkpoint] loadUserData - Task will be blocked until admin approval');
                setUser(prev => prev ? {
                  ...prev,
                  phase2_checkpoint: checkpoint,
                  has_pending_checkpoint: true
                } : null);
              } else if (checkpoint.status === 'approved') {
                // Check if this is a broken state: checkpoint approved but task_number already advanced
                // This happens when bonus was added but checkpoint status update failed
                const currentTaskNum = trainingAccount?.task_number || 0;
                const checkpointTaskNum = checkpoint.task_number || 0;
                
                if (currentTaskNum > checkpointTaskNum) {
                  console.log('[Checkpoint] loadUserData - RECOVERY: Checkpoint approved but task_number advanced (' + 
                    checkpointTaskNum + ' -> ' + currentTaskNum + '). Treating as completed.');
                  // Auto-update checkpoint status to completed in background
                  SupabaseService.updateCheckpointStatus(checkpoint.id, 'completed').catch(err => {
                    console.error('[Checkpoint] Auto-recovery failed:', err);
                  });
                  // Clear checkpoint from state so tasks can render
                  setUser(prev => prev ? {
                    ...prev,
                    phase2_checkpoint: null,
                    has_pending_checkpoint: false
                  } : null);
                } else {
                  console.log('[Checkpoint] loadUserData - Checkpoint approved - user must submit premium product');
                  setUser(prev => prev ? {
                    ...prev,
                    phase2_checkpoint: checkpoint,
                    has_pending_checkpoint: false
                  } : null);
                }
              }
            } else {
              console.log('[Checkpoint] loadUserData - No existing checkpoint found for this user');
            }
          }
        } else {
          console.log('[loadUserData] No training account found in Supabase');
          // Don't reset wallet state to 0 - this causes flash of 0 balance on refresh
          // Keep existing state or set to loading state instead
          console.log('[loadUserData] Training account not found, keeping existing wallet state');
        }
      } catch (error) {
        console.error('[loadUserData] Error loading training data:', error);
        // Don't reset wallet state to 0 - this causes flash of 0 balance on refresh
        // Keep existing state or set to loading state instead
        console.log('[loadUserData] Error loading training data, keeping existing wallet state');
      }
    } else {
      // For personal/admin accounts, load from Supabase
      try {
        console.log('[loadUserData] Loading personal account data from database');
        
        // Update user state with fresh data from database (including balance and tasks_locked)
        setUser(prev => prev ? {
          ...prev,
          balance: dbUser.balance, // Use fresh balance from database
          total_earned: dbUser.total_earned, // Use fresh total_earned from database
          tasks_locked: dbUser.tasks_locked || false, // Use tasks_locked directly from DB
          linked_training_account_id: dbUser.linked_training_account_id || null, // Use linked_training_account_id from DB
          training_completed: dbUser.training_completed || false, // Use training_completed from DB
          commission_transferred: dbUser.commission_transferred || false, // Use commission_transferred from DB
          user_status: dbUser.user_status || 'pending', // Use user_status from DB
        } : null);

        // Update wallet state with fresh balance from database
        setWalletState(prev => ({
          ...prev,
          available_balance: dbUser.balance, // Use fresh balance from database
          total_earned: dbUser.total_earned, // Use fresh total_earned from database
        }));

        console.log('[loadUserData] Updated user state with fresh DB data:', {
          balance: dbUser.balance,
          tasks_locked: dbUser.tasks_locked,
          linked_training_account_id: dbUser.linked_training_account_id,
          training_completed: dbUser.training_completed,
          commission_transferred: dbUser.commission_transferred,
          user_status: dbUser.user_status
        });

        // Load tasks - create 35 tasks if none exist for personal account
        // For VIP1 accounts, check if tasks_completed equals 35 before creating fresh tasks
        const tasksCompleted = dbUser.tasks_completed || 0;
        const dbTasks = await SupabaseService.getUserTasks(userId);
        
        if (!dbTasks || dbTasks.length === 0) {
          // Only create fresh tasks if user hasn't completed any tasks yet
          if (tasksCompleted === 0) {
            console.log('[loadUserData] No tasks found and tasks_completed is 0, creating 35 tasks');
            const tasksCreated = await SupabaseService.createTrainingTasks(userId, 35);
            console.log('[loadUserData] Task creation result:', tasksCreated);
            
            if (tasksCreated) {
              const newTasks = await SupabaseService.getUserTasks(userId);
              console.log('[loadUserData] Loaded new tasks after creation:', newTasks?.length);
              setTasks((newTasks || []).map(mapDatabaseTaskToTask));
            } else {
              console.error('[loadUserData] Failed to create tasks');
              setTasks([]);
            }
          } else {
            console.log('[loadUserData] No tasks found but tasks_completed is', tasksCompleted, '- not creating fresh tasks to preserve completed state');
            setTasks([]);
          }
        } else {
          console.log('[loadUserData] Loaded existing tasks:', dbTasks.length);
          setTasks(dbTasks.map(mapDatabaseTaskToTask));
        }
      } catch (error) {
        console.error('Error loading personal account data:', error);
        setTasks([]);
      }
    }

    // For personal/admin accounts, load transactions and wallets from Supabase
    if (!isTraining) {
      try {
        // Load transactions
        const dbTransactions = await SupabaseService.getUserTransactions(userId);
        setTransactions((dbTransactions || []).map(mapDatabaseTransactionToTransaction));
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }

      try {
        // Load wallets - pass userId directly to avoid race condition
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading wallets:', error);
          setWallets([]);
        } else {
          setWallets(data as Wallet[]);
        }
      } catch (error) {
        console.error('Error loading wallets:', error);
        setWallets([]);
      }
    } else {
      // For training accounts, clear Supabase-based state
      setTransactions([]);
      setWallets([]);
    }
  };

  // ===========================================
  // AUTH FUNCTIONS
  // ===========================================
  
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      console.log('[AppContext.login] Attempting login for email:', email);
      
      // Try Supabase auth for personal accounts
      console.log('[AppContext.login] Trying Supabase auth...');
      const { user: dbUser, error } = await SupabaseService.signIn(email, password);
      
      if (error || !dbUser) {
        setAuthLoading(false);
        // Provide clearer error message - do NOT reset app state on failed login
        const errorMsg = error || 'Login failed';
        console.log('[AppContext.login] Supabase auth failed:', errorMsg);
        // Failed login should NOT trigger logout - just return error
        return { success: false, error: errorMsg };
      }
      
      setUser(mapDatabaseUserToUser(dbUser));
      setIsAuthenticated(true);
      await loadUserData(dbUser.id, dbUser.email);
      setAuthLoading(false);
      
      // Check and transfer commission from completed training accounts (only for personal accounts)
      if (dbUser.account_type === 'personal') {
        console.log('[AppContext.login] Checking for commission transfer from training accounts...');
        const transferResult = await SupabaseService.checkAndTransferCommission(dbUser.id);
        
        if (transferResult.success && transferResult.transferred) {
          toast({
            title: 'Training completed successfully!',
            description: `$${transferResult.amount?.toFixed(2)} has been transferred to your personal account. Your account is now fully activated.`,
            variant: 'default',
          });
          
          // Refresh user data to show updated balance
          await loadUserData(dbUser.id, dbUser.email);
        }
      }
      
      toast({
        title: 'Welcome back!',
        description: `Successfully logged in as ${dbUser.display_name}`
      });
      
      // Send Telegram notification for login
      const deviceInfo = getDeviceInfo();
      await sendTelegramNotification({
        type: 'user_login',
        email: dbUser.email,
        accountType: dbUser.account_type,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
        timestamp: new Date().toISOString()
      });
      
      console.log('[AppContext.login] Login successful for:', email);
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      console.log('[AppContext.login] Exception during login:', error);
      // Exception should NOT trigger logout - just return error
      return { success: false, error: error.message };
    }
  };

  const loginTrainingAccount = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[loginTrainingAccount] Attempting Supabase auth for training account:', email);
      
      // Use Supabase auth to sign in (training accounts should have auth users)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });
      
      if (authError || !authData.user) {
        console.log('[loginTrainingAccount] Supabase auth failed:', authError);
        return { success: false, error: authError?.message || 'Invalid credentials' };
      }
      
      console.log('[loginTrainingAccount] Supabase auth successful, user ID:', authData.user.id);
      
      // Fetch training account data from training_accounts table
      const { data: trainingAccount, error: trainingError } = await supabase
        .from('training_accounts')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();
      
      console.log('[DEBUG] Training account data:', trainingAccount);
      
      if (!trainingAccount || trainingError) {
        console.log('[loginTrainingAccount] No training account found for this auth user');
        // User exists in auth but no training account record - create minimal user state
        const trainingUser: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          phone: null,
          display_name: authData.user.user_metadata?.display_name || email.split('@')[0] || 'Training User',
          vip_level: 2 as const,
          balance: 1100,
          total_earned: 0,
          referral_code: '',
          created_at: authData.user.created_at || new Date().toISOString(),
          account_type: 'training',
          training_completed: false,
          training_progress: 0,
          user_status: 'active',
          training_phase: 1,
          tasks_completed: 0,
          total_tasks: 45,
          task_number: 1,
          current_task_set: 1,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          is_training_account: true,
          // VIP1 lock mechanism fields
          tasks_locked: false,
          linked_training_account_id: null,
          // Phase 2 tracking fields
          training_phase_2_checkpoint: null,
          training_completed_v2: false,
          commission_transferred: false,
          commission_transfer_amount: 0,
          commission_transferred_at: null,
          training_phase_1_locked: false,
          training_phase_1_locked_at: null
        };
        
        setUser(trainingUser);
        setIsAuthenticated(true);
        await loadUserData(trainingUser.id, trainingUser.email);
      } else {
        // Fetch user data from users table to get balance (should include initial + earned)
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        // Check if training is completed
        const isTrainingCompleted = userData?.training_completed === true || userData?.training_completed_v2 === true;

        // For completed training, use total_earned from training_accounts.amount (earned rewards only)
        // For in-progress training, use users.total_earned
        const totalEarned = isTrainingCompleted
          ? (trainingAccount.amount || 0) // Only earned rewards from training_accounts
          : (userData?.total_earned || 0); // Use users table for in-progress

        // Use training account data from database
        const trainingUser: User = {
          id: authData.user.id,
          email: trainingAccount.email,
          phone: null,
          display_name: trainingAccount.email.split('@')[0] || 'Training User',
          vip_level: 2 as const,
          balance: userData?.balance || 0, // Use balance from users table (should include initial + earned)
          total_earned: totalEarned, // Use calculated total_earned based on training completion status
          referral_code: '',
          created_at: trainingAccount.created_at,
          account_type: 'training',
          training_completed: isTrainingCompleted,
          training_progress: 0, // No progress column in DB
          user_status: 'active',
          training_phase: userData?.training_phase || 1,
          tasks_completed: Math.max(0, (trainingAccount.task_number || 1) - 1), // Calculate from task_number
          task_number: trainingAccount.task_number || 1, // Next task to complete
          total_tasks: trainingAccount.total_tasks || 45,
          current_task_set: 1,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          is_training_account: true,
          // VIP1 lock mechanism fields
          tasks_locked: false,
          linked_training_account_id: null,
          // Phase 2 tracking fields
          training_phase_2_checkpoint: null,
          training_completed_v2: userData?.training_completed_v2 || false,
          commission_transferred: userData?.commission_transferred || false,
          commission_transfer_amount: userData?.commission_transfer_amount || 0,
          commission_transferred_at: userData?.commission_transferred_at || null,
          training_phase_1_locked: false,
          training_phase_1_locked_at: null
        };

        console.log('[loginTrainingAccount] Setting training user state with DB values:', {
          email: trainingUser.email,
          balance: trainingUser.balance,
          total_earned: trainingUser.total_earned,
          training_completed: trainingUser.training_completed,
          tasks_completed: trainingUser.tasks_completed,
          total_tasks: trainingUser.total_tasks
        });

        setUser(trainingUser);
        setIsAuthenticated(true);
        await loadUserData(trainingUser.id, trainingUser.email);
      }
      
      setAuthLoading(false);
      
      toast({
        title: 'Training Account',
        description: 'Logged in as training account'
      });
      
      // Send Telegram notification for login
      const deviceInfo = getDeviceInfo();
      await sendTelegramNotification({
        type: 'user_login',
        email: trainingUser.email,
        accountType: 'training',
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
        timestamp: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      console.error('[loginTrainingAccount] Error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, displayName: string, phone?: string, referralCode?: string | null): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      const { user: dbUser, error } = await SupabaseService.signUp(email, password, displayName, phone, referralCode);

      if (error || !dbUser) {
        setAuthLoading(false);
        return { success: false, error: error || 'Registration failed' };
      }

      const mappedUser = mapDatabaseUserToUser(dbUser);
      setUser(mappedUser);
      setIsAuthenticated(true);
      await loadUserData(dbUser.id, dbUser.email);

      setAuthLoading(false);

      toast({
        title: 'Welcome!',
        description: 'Account created successfully'
      });

      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async (): Promise<void> => {
    // Check if this is a training account that has completed both phases
    if (user && user.account_type === 'training' && !user.training_completed) {
      // Check if all training tasks are completed (Phase 1 + Phase 2 = 90 tasks)
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTrainingTasks = 90; // 45 Phase 1 + 45 Phase 2
      
      if (completedTasks >= totalTrainingTasks) {
        console.log('[AppContext] Training completed! Auto-transferring balance to personal account...');
        
        try {
          // Attempt to complete training and transfer balance
          const result = await SupabaseService.completeTrainingAndTransferBalance(user.id);
          
          if (result.success && result.transferredAmount && result.transferredAmount > 0) {
            toast({ 
              title: '🎉 Training Completed!', 
              description: `$${result.transferredAmount.toFixed(2)} has been automatically transferred to your personal account.` 
            });
            
            // Show additional notification
            setTimeout(() => {
              toast({ 
                title: 'Login to Personal Account', 
                description: 'Your earnings are now in your personal account. Please login with your personal account credentials.' 
              });
            }, 2000);
          } else {
            console.log('[AppContext] Training completion result:', result);
          }
        } catch (error) {
          console.error('[AppContext] Error auto-completing training:', error);
        }
      }
    }
    
    await SupabaseService.signOut();

    // Clear session-only localStorage keys
    localStorage.removeItem('opt_user');
    localStorage.removeItem('main_admin_authenticated');

    // Clear training account localStorage data
    const userEmail = user?.email?.toLowerCase();
    if (userEmail) {
      localStorage.removeItem(`training_account_${userEmail}`);
      localStorage.removeItem(`training_tasks_${userEmail}`);
      localStorage.removeItem(`training_wallet_${userEmail}`);
      localStorage.removeItem(`training_history_${userEmail}`);
    }

    // Reset all auth state immediately
    setUser(null);
    setIsAuthenticated(false);
    setTasks([]);
    setTransactions([]);
    setWallets([]);

    toast({ title: 'Logged out', description: 'See you soon!' });
  };

  // ===========================================
  // TASK FUNCTIONS
  // ===========================================

  const completeTask = async (taskNumber: number): Promise<{ success: boolean; reward?: number }> => {
    const executionId = Date.now();
    
    if (!user) {
      console.error('[completeTask FAIL] Line 1016 - User not found', { user, taskNumber });
      isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
    }

    isCheckingAuth.current = true;
    setIsLoading(true);

    let result: { success: boolean; reward?: number } | null = null;

    // For training accounts, handle completion by updating training_accounts table
    if (user.account_type === 'training') {
      const task = tasks.find(t => t.task_number === taskNumber);
      if (!task) {
        console.error('[completeTask FAIL] Line 1040 - Task not found in local tasks array', { taskNumber, tasks: tasks.map(t => t.task_number) });
        isCheckingAuth.current = false;
        setIsLoading(false);
        return { success: false };
      }

      
      // ===========================================
      // PHASE 2 CHECKPOINT DETECTION - BEFORE TASK COMPLETION
      // ONLY RUN IN PHASE 2 - Phase 1 has NO checkpoint logic
      // ===========================================
      const isPhase2 = Number(user?.training_phase) === 2;
      
      // Only check for checkpoints in Phase 2
      if (isPhase2) {
        
        // Check if this is a checkpoint task (31 or 32 in Phase 2)
        const isCheckpointTask = taskNumber === 31 || taskNumber === 32;
        
        if (isCheckpointTask) {
        // Check if ANY checkpoint already exists for this user (regardless of task_number)
        // Phase 2 only allows ONE checkpoint event per training phase
        const existingCheckpoint = await SupabaseService.getAnyPhase2Checkpoint(user.id);
        
        if (existingCheckpoint) {
          
          // If checkpoint is completed/bonus_paid, allow normal task completion (checkpoint already processed)
          // Do NOT show checkpoint modal again
          if (
  existingCheckpoint.status === 'completed' ||
  existingCheckpoint.status === 'bonus_paid' ||
  existingCheckpoint.status === 'submitted' ||
  task.task_number > existingCheckpoint.task_number
) {

  setUser(prevUser => ({
    ...prevUser,
    phase2_checkpoint: null,
    has_pending_checkpoint: false
  }));

  // continue to normal task completion below
}

else if (existingCheckpoint.status === 'pending_review') {
  console.error('[completeTask FAIL] Line 1099 - Checkpoint pending review (blocks submission)', { taskNumber, existingCheckpoint });
  setUser(prevUser => ({
    ...prevUser,
    phase2_checkpoint: existingCheckpoint,
    has_pending_checkpoint: true
  }));

  isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
}

else if (
  existingCheckpoint.status === 'approved' &&
  task.task_number <= existingCheckpoint.task_number
) {
  console.error('[completeTask FAIL] Line 1116 - Approved checkpoint requires premium submit', { taskNumber, existingCheckpoint });
  setUser(prevUser => ({
    ...prevUser,
    phase2_checkpoint: existingCheckpoint,
    has_pending_checkpoint: true
  }));

  isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
}
        } else {
          // No checkpoint exists - create one (first time only)
          
          // Get products for checkpoint display (current task and next task)
          const product1 = ProductCatalogService.getProductForTask(taskNumber, 'training');
          const product2 = ProductCatalogService.getProductForTask(taskNumber + 1, 'training');
          
          // Create checkpoint in Supabase BEFORE allowing task completion
          const checkpoint = await SupabaseService.createPhase2Checkpoint(
            user.id,
            user.email || '',
            taskNumber, // Store the current task number (31 or 32)
            {
              name: product1.name,
              image: product1.image,
              price: product1.price
            },
            {
              name: product2.name,
              image: product2.image,
              price: product2.price
            },
            100 // Default bonus amount
          );
          
          if (checkpoint) {
            console.error('[completeTask FAIL] Line 1157 - Checkpoint created successfully (blocks submission until premium product submitted)', { taskNumber, checkpoint });
            
            // Store checkpoint in user state for UI detection
            setUser(prevUser => ({
              ...prevUser,
              phase2_checkpoint: checkpoint
            }));
            
            // DO NOT complete the task - block submission
            isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
          }
        }
      }
    }
      
      // Note: Approved checkpoint stays in state so UI shows premium submit button
      // It will be cleared after user submits premium product and checkpoint becomes completed
      
      // ===========================================
      // NORMAL TASK COMPLETION (non-checkpoint tasks or after approval)
      // ===========================================
      
      // RESTORED: Original product-based commission with scaling to achieve $165.60 total
      // Each product has unique commission based on its price
      // Total scaled to equal exactly $165.60 for Phase 1 (45 tasks)
      const PHASE1_TARGET_TOTAL = 165.60;
      const RAW_COMMISSION_RATE = 0.01; // 1% base rate
      const SCALE_FACTOR = 2.735; // Scale raw commissions to reach $165.60 total
      
      // Get product from catalog for commission calculation
      const product = ProductCatalogService.getProductForTask(taskNumber, 'training');
      const rawCommission = product.price * RAW_COMMISSION_RATE;
      const scaledCommission = Math.round(rawCommission * SCALE_FACTOR * 100) / 100;
      
      
      // Use scaled product-based commission
      const commission = scaledCommission;
      
      // Calculate new values BEFORE any state updates
      const prevCompletedCount = tasks.filter(t => t.status === 'completed').length;
      const updatedCompleted = prevCompletedCount + 1;
      const nextTaskNumber = updatedCompleted + 1;


      // Safety check for user ID
      if (!user?.id) {
        console.error('[completeTask FAIL] Line 1202 - User ID missing, cannot update progress', { user, taskNumber });
        isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
      }

      // Get current balance from training_accounts
      const { data: currentTrainingAccount, error: fetchError } = await supabase
        .from('training_accounts')
        .select('amount')
        .eq('auth_user_id', user.id)
        .single();
      
      if (fetchError || !currentTrainingAccount) {
        console.error('[completeTask FAIL] Line 1216 - Error fetching current balance from training_accounts', { fetchError, currentTrainingAccount, userId: user.id, taskNumber });
        isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
      }
      
      const oldBalance = currentTrainingAccount.amount || 0;
      const newBalance = oldBalance + commission;
      

      // Update Supabase FIRST (source of truth)
      const updatePayload = {
        task_number: nextTaskNumber,
        amount: newBalance,
        commission: commission
      };
      
      
      try {
        const { error } = await supabase
          .from('training_accounts')
          .update(updatePayload)
          .eq('auth_user_id', user.id);

        if (error) {
          console.error('[completeTask FAIL] Line 1251 - Supabase update failed (training_accounts update)', { error, updatePayload, userId: user.id, taskNumber });
          console.error('[Task Submit] Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          // FAIL-SAFE: Do NOT update local state if DB fails
          isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
        }

        
      } catch (error) {
        console.error('[completeTask FAIL] Line 1261 - Exception during Supabase update', { error, userId: user.id, taskNumber });
        // FAIL-SAFE: Do NOT update local state if DB fails
        isCheckingAuth.current = false;
  setIsLoading(false);
  return { success: false };
      }

      // Update local state ONLY AFTER DB success
      const updatedTasks = tasks.map(t =>
        t.task_number === taskNumber
          ? {
              ...t,
              status: 'completed' as const,
              completed_at: new Date().toISOString(),
              reward: commission // Update task reward with commission
            }
          : t
      );

      setTasks(updatedTasks);

      // Update localStorage for training tasks
      const emailKey = user.email.toLowerCase();
      localStorage.setItem(`training_tasks_${emailKey}`, JSON.stringify(updatedTasks));

      // Update user state with functional update to avoid stale values
      // Preserve existing total_earned - do NOT recalculate from balance
      setUser(prevUser => ({
        ...prevUser,
        tasks_completed: updatedCompleted,
        training_progress: updatedCompleted,
        balance: newBalance, // Update balance locally
        total_earned: prevUser.total_earned + commission // Add commission to existing total_earned
      }));

      // Update wallet state with new balance
      setWalletState(prev => ({
        ...prev,
        available_balance: newBalance,
        total_earned: prev.total_earned + commission // Add commission to existing total_earned
      }));
      
      // Also update total_earned in public.users table for consistency
      try {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ total_earned: user.total_earned + commission })
          .eq('id', user.id);
        
        if (userUpdateError) {
          console.error('[Task Submit] Failed to update users.total_earned:', userUpdateError);
        } else {
        }
      } catch (userUpdateErr) {
        console.error('[Task Submit] Exception updating users.total_earned:', userUpdateErr);
      }


      // Refresh user and tasks in background (non-blocking)
      refreshUser().catch(err => console.error('[Task Submit] Background refresh failed:', err));
      await refreshTasks(); // AWAIT for personal accounts to ensure UI sync

      return { success: true, reward: commission };
    } else {
      // For personal accounts, use Supabase
      result = await SupabaseService.completeTask(user.id, taskNumber);

      if (result?.success && result?.reward) {
        // Add to task history
        const task = tasks.find(t => t.task_number === taskNumber);
        if (task) {
          const historyEntry: TaskHistory = {
            id: `${Date.now()}_${taskNumber}`,
            task_number: taskNumber,
            product_name: task.title,
            reward: result.reward,
            completed_at: new Date().toISOString()
          };

          // Add task_reward transaction
          const transaction: Transaction = {
            id: `tx_${Date.now()}_${taskNumber}`,
            user_id: user.id,
            type: 'task_reward',
            amount: result.reward,
            status: 'completed',
            description: `Task ${taskNumber} reward: ${task.title}`,
            created_at: new Date().toISOString(),
            reference_id: task.id,
            reference_type: 'task'
          };

          // Update wallet state
          const updatedWallet = {
            available_balance: walletState.available_balance + result.reward,
            pending_balance: walletState.pending_balance,
            total_earned: walletState.total_earned + result.reward,
            total_withdrawn: walletState.total_withdrawn,
            transactions: [transaction, ...walletState.transactions]
          };

          // For personal accounts, store in state
          setTaskHistory(prev => [historyEntry, ...prev]);
          setWalletState(updatedWallet);
        }
      }

      toast({
        title: 'Task Completed!',
        description: `You earned $${(result?.reward || 0).toFixed(2)}`
      });

      // Refresh user and tasks - AWAIT to ensure UI sync with database
      await refreshUser();
      await refreshTasks();

      // Check if we should trigger pending order for personal accounts
      // Phase 2, task 28 triggers pending order
      if (user.account_type === 'personal' &&
          user.training_phase === 2 &&
          taskNumber === 28 &&
          !user.has_pending_order) {

        // Create combination product for pending order
        const product1 = {
          name: 'Premium Wireless Headphones',
          brand: 'AudioTech',
          price: 45,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
        };
        const product2 = {
          name: 'Smart Watch Series 5',
          brand: 'TechGear',
          price: 38,
          category: 'Wearables',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
        };

        const combinedPrice = product1.price + product2.price; // $83
        const pendingAmount = combinedPrice - user.balance; // Will be negative

        // Create pending order
        await createPendingOrder(28, Math.abs(pendingAmount), {
          name: `${product1.name} + ${product2.name}`,
          brand: 'Combination Product',
          price: combinedPrice,
          category: 'Premium Bundle',
          image: product1.image,
          price1: product1.price,
          price2: product2.price,
          image1: product1.image,
          image2: product2.image,
          name1: product1.name,
          name2: product2.name
        });

        toast({
          title: 'Combination Order Detected!',
          description: 'A premium combination product has been assigned. Contact customer service to clear.',
          variant: 'destructive'
        });
      }
    }

    isCheckingAuth.current = false;
    setIsLoading(false);
    return result || { success: false };
  };

  const refreshTasks = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    // Guard against duplicate refreshes within 2 seconds
    const now = Date.now();
    if (isRefreshingTasks.current) {
      console.log('[refreshTasks] skipped - already refreshing');
      return;
    }
    if (now - lastRefreshTime.current < 2000) {
      console.log('[refreshTasks] skipped duplicate refresh - last refresh was', now - lastRefreshTime.current, 'ms ago');
      return;
    }
    
    isRefreshingTasks.current = true;
    lastRefreshTime.current = now;
    
    // Add null checks with fallback values for VIP1
    const vipLevel = user.vip_level || 1;
    const currentTaskSet = user.current_task_set || 1;
    const totalTasks = user.total_tasks || 45; // Default to 45 for training, database should provide this
    const taskNumber = user.task_number || 1;

    console.log('[refreshTasks] Starting refreshTasks - account_type:', user.account_type, 'user.id:', user.id, 'vipLevel:', vipLevel, 'currentTaskSet:', currentTaskSet, 'totalTasks:', totalTasks, 'taskNumber:', taskNumber);
    
    // For training accounts, rebuild tasks from Supabase task_number (source of truth)
    if (user.account_type === 'training' && user.email) {
      try {
        // FETCH FRESH task_number and training_completed from Supabase to avoid stale closure issues
        const { data: freshAccount, error: fetchError } = await supabase
          .from('training_accounts')
          .select('task_number, completed_tasks')
          .eq('auth_user_id', user.id)
          .single();

        if (fetchError) {
          console.error('[refreshTasks] Error fetching fresh task_number:', fetchError);
        }

        const emailKey = user.email.toLowerCase();
        // Use FRESH task_number from Supabase (next task to complete) with fallback
        const currentTaskNumber = freshAccount?.task_number || taskNumber || 1;
        const isTrainingCompleted = freshAccount?.completed_tasks === true || user.training_completed === true;
        const completedTasks = Math.max(0, currentTaskNumber - 1);

        console.log('[refreshTasks] FRESH task_number from Supabase:', currentTaskNumber, 'completed:', completedTasks, 'training_completed:', isTrainingCompleted);

        // If training is completed, load existing tasks from database instead of rebuilding
        // This preserves the completed state (45/45) and prevents reset to 0/45
        if (isTrainingCompleted) {
          console.log('[refreshTasks] Training completed - loading existing tasks from database to preserve state');
          const dbTasks = await SupabaseService.getUserTasks(user.id);
          if (dbTasks && dbTasks.length > 0) {
            setTasks(dbTasks.map(mapDatabaseTaskToTask));
            console.log('[refreshTasks] Loaded completed tasks from database, count:', dbTasks.length);
          } else {
            // Fallback: if no tasks in DB but training is completed, rebuild with all tasks completed
            const RAW_COMMISSION_RATE = 0.01;
            const SCALE_FACTOR = 2.735;
            const completedTasksArray: Task[] = Array.from({ length: totalTasks }, (_, i) => {
              const taskNum = i + 1;
              const product = ProductCatalogService.getProductForTask(taskNum, 'training');
              const rawCommission = product.price * RAW_COMMISSION_RATE;
              const scaledCommission = Math.round(rawCommission * SCALE_FACTOR * 100) / 100;
              
              return {
                id: `task_${taskNum}`,
                user_id: user.id,
                task_number: taskNum,
                title: product.name,
                description: `Complete task ${taskNum}`,
                reward: scaledCommission,
                status: 'completed' as const,
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                task_set: 0
              };
            });
            setTasks(completedTasksArray);
            console.log('[refreshTasks] Rebuilt completed tasks as fallback, count:', completedTasksArray.length);
          }
          isRefreshingTasks.current = false;
          return;
        }

        // RESTORED: Original product-based commission with scaling to achieve $165.60 total
        const RAW_COMMISSION_RATE = 0.01; // 1% base rate
        const SCALE_FACTOR = 2.735; // Scale raw commissions to reach $165.60 total

        // Rebuild tasks array based on Supabase task_number (only for active/incomplete training)
        const rebuiltTasks: Task[] = Array.from({ length: totalTasks }, (_, i) => {
          const taskNum = i + 1;
          const product = ProductCatalogService.getProductForTask(taskNum, 'training');

          // Calculate scaled product-based commission (unique for each product)
          const rawCommission = product.price * RAW_COMMISSION_RATE;
          const scaledCommission = Math.round(rawCommission * SCALE_FACTOR * 100) / 100;

          let status: 'pending' | 'completed' | 'locked' = 'locked';
          if (taskNum < currentTaskNumber) {
            status = 'completed';
          } else if (taskNum === currentTaskNumber) {
            status = 'pending';
          }

          return {
            id: `task_${taskNum}`,
            user_id: user.id,
            task_number: taskNum,
            title: product.name,
            description: `Complete task ${taskNum}`,
            reward: scaledCommission,
            status,
            created_at: new Date().toISOString(),
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            task_set: 0
          };
        });

        setTasks(rebuiltTasks);

        // Update localStorage with rebuilt tasks
        localStorage.setItem(`training_tasks_${emailKey}`, JSON.stringify(rebuiltTasks));
        console.log('[refreshTasks] Rebuilt and saved training tasks, count:', rebuiltTasks.length, 'current task:', currentTaskNumber);
      } catch (error) {
        console.error('[refreshTasks] Error rebuilding training tasks:', error);
      } finally {
        isRefreshingTasks.current = false;
      }
      return;
    }
    
    // For personal/admin accounts, load from Supabase
    try {
      console.log('[refreshTasks] Loading personal/admin tasks from Supabase');
      const dbTasks = await SupabaseService.getUserTasks(user.id);
      const tasksCount = (dbTasks || []).length;
      
      // For VIP1 personal accounts, prevent resetting tasks to empty array when tasks_completed is 35 or 70
      // This preserves the completion state when the tasks table is empty after customer service reset
      const isVIP1Personal = user.account_type === 'personal' && user.vip_level === 1;
      const tasksCompleted = user.tasks_completed || 0;
      const shouldPreserveState = isVIP1Personal && (tasksCompleted === 35 || tasksCompleted === 70) && tasksCount === 0;
      
      if (shouldPreserveState) {
        console.log('[refreshTasks] VIP1 personal account with tasks_completed', tasksCompleted, 'but empty tasks array - preserving state to prevent reset to 0');
        // Don't reset tasks to empty array - keep existing state
      } else {
        setTasks((dbTasks || []).map(mapDatabaseTaskToTask));
        console.log('[refreshTasks] Set tasks from Supabase, count:', tasksCount);
      }
    } catch (error) {
      console.error('[refreshTasks] Error refreshing tasks:', error);
      // Only reset to empty if not a VIP1 account with completed tasks
      const isVIP1Personal = user.account_type === 'personal' && user.vip_level === 1;
      const tasksCompleted = user.tasks_completed || 0;
      if (!isVIP1Personal || (tasksCompleted !== 35 && tasksCompleted !== 70)) {
        setTasks([]);
      } else {
        console.log('[refreshTasks] Error but preserving VIP1 completion state (tasks_completed:', tasksCompleted, ')');
      }
    } finally {
      isRefreshingTasks.current = false;
    }
  }, [user]);

  // ===========================================
  // USER FUNCTIONS
  // ===========================================
  
  const refreshUser = async (): Promise<void> => {
    if (!user) return;

    // For training accounts, fetch from training_accounts table (Supabase is source of truth)
    if (user.account_type === 'training' && user.id) {
      try {
        // Fetch all training accounts for this user to handle duplicates
        const { data: trainingAccounts, error } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('auth_user_id', user.id);

        console.log('[DEBUG] Training account data:', trainingAccounts);

        // Prefer record with populated amount/task_number over null values
        let trainingAccount = null;
        if (trainingAccounts && trainingAccounts.length > 0) {
          // First try to find record with populated amount
          trainingAccount = trainingAccounts.find(ta => ta.amount !== null && ta.amount !== undefined);
          // If no record with amount, try to find record with populated task_number
          if (!trainingAccount) {
            trainingAccount = trainingAccounts.find(ta => ta.task_number !== null && ta.task_number !== undefined);
          }
          // If still no record with populated fields, use the first one
          if (!trainingAccount) {
            trainingAccount = trainingAccounts[0];
          }
        }

        if (trainingAccount && !error) {
          console.log('[refreshUser] Training account data from Supabase:', trainingAccount);
          const trainingTaskNumber = trainingAccount.task_number || 1;
          const completedTasks = Math.max(0, trainingTaskNumber - 1);
          const earnedRewards = trainingAccount.amount || 0; // Only earned rewards, not including initial capital

          // Fetch current balance from database to use as source of truth
          // Use maybeSingle() to handle 406 errors gracefully
          const { data: dbUser, error: balanceError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', user.id)
            .maybeSingle();

          if (balanceError) {
            console.error('[refreshUser] Error fetching balance from users table:', balanceError);
          }

          const dbBalance = dbUser?.balance || 0;

          setUser(prev => prev ? {
            ...prev,
            balance: dbBalance, // Use balance from users table (includes initial + earned)
            total_earned: earnedRewards, // Use only earned rewards from training_accounts.amount
            task_number: trainingTaskNumber, // Next task to complete
            tasks_completed: completedTasks, // Calculate from task_number
            training_progress: completedTasks, // Use calculated value
            training_completed: trainingAccount.completed_tasks || false
          } : null);
        }
      } catch (error) {
        console.error('[refreshUser] Error fetching training account:', error);
      }
      return;
    }

    // For personal/admin accounts, load from Supabase
    const dbUser = await SupabaseService.getUserById(user.id);
    if (dbUser) {
      setUser(mapDatabaseUserToUser(dbUser));
    }
  };

  const refreshApp = async (): Promise<void> => {
    // Prevent concurrent refresh calls (could cause lock contention)
    if (isRefreshingApp.current) {
      console.log('[refreshApp] Refresh already in progress, skipping...');
      return;
    }

    isRefreshingApp.current = true;
    console.log('[refreshApp] Starting comprehensive app refresh...');

    try {
      // 1. Validate and refresh Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('[refreshApp] Session invalid, signing out:', sessionError);
        await logout();
        return;
      }

      // 2. Refresh user data
      await refreshUser();

      // 3. Refresh tasks with timeout protection
      const tasksPromise = refreshTasks();
      const tasksTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Tasks refresh timeout')), 10000)
      );
      await Promise.race([tasksPromise, tasksTimeout]).catch(err => {
        console.error('[refreshApp] Tasks refresh failed or timed out:', err);
      });

      // 4. Refresh wallets/transactions for non-training accounts
      if (user?.account_type !== 'training') {
        const walletsPromise = refreshWallets();
        const txPromise = refreshTransactions();

        const walletsTimeout = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Wallets refresh timeout')), 10000)
        );
        const txTimeout = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Transactions refresh timeout')), 10000)
        );

        await Promise.race([walletsPromise, walletsTimeout]).catch(err => {
          console.error('[refreshApp] Wallets refresh failed or timed out:', err);
        });
        await Promise.race([txPromise, txTimeout]).catch(err => {
          console.error('[refreshApp] Transactions refresh failed or timed out:', err);
        });
      }

      // 5. Clear any frozen loading states
      setIsLoading(false);
      setAuthLoading(false);

      console.log('[refreshApp] App refresh completed successfully');
    } catch (error) {
      console.error('[refreshApp] Error during app refresh:', error);
      // Even if refresh fails, clear loading states to prevent freeze
      setIsLoading(false);
      setAuthLoading(false);
    } finally {
      isRefreshingApp.current = false;
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    // For training accounts, update localStorage wallet state only (skip Supabase)
    // BUT if training is completed, skip localStorage updates entirely to prevent balance reset
    if (user.account_type === 'training') {
      const isTrainingCompleted = user.training_completed === true || user.training_completed_v2 === true;
      
      if (isTrainingCompleted) {
        console.log('[updateUser] Training account completed - skipping localStorage updates, use Supabase only');
        // Don't update localStorage for completed training to prevent balance reset
        return true;
      }
      
      if (updates.balance !== undefined) {
        const updatedWallet = {
          ...walletState,
          available_balance: updates.balance,
          total_earned: updates.total_earned || walletState.total_earned
        };
        setWalletState(updatedWallet);
        const emailKey = user.email.toLowerCase();
        localStorage.setItem(`training_wallet_${emailKey}`, JSON.stringify(updatedWallet));
      }
      return true;
    }
    
    // For personal/admin accounts, update in Supabase
    // Map frontend User type to DatabaseUser type
    const dbUpdates: Partial<DatabaseUser> = {};
    if (updates.display_name) dbUpdates.display_name = updates.display_name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.vip_level) dbUpdates.vip_level = updates.vip_level;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.total_earned !== undefined) dbUpdates.total_earned = updates.total_earned;
    
    const success = await SupabaseService.updateUser(user.id, dbUpdates);
    
    if (success) {
      await refreshUser();
    }
    
    return success;
  };

  // ===========================================
  // PENDING ORDER FUNCTIONS
  // ===========================================
  
  const createPendingOrder = async (taskNumber: number, amount: number, product: any): Promise<boolean> => {
    if (!user) return false;
    
    const success = await SupabaseService.createPendingOrder(user.id, taskNumber, amount, product);
    
    if (success) {
      await refreshUser();
      await refreshTransactions();
      
      toast({
        title: 'Combination Order Created',
        description: 'Complete the purchase to unlock tasks and claim 6x profit'
      });
    }
    
    return success;
  };

  const clearPendingOrderAndClaimProfit = async (): Promise<{ success: boolean; profit?: number; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const result = await SupabaseService.clearPendingOrderAndAddProfit(user.id);
    
    if (result.success && result.profit) {
      await refreshUser();
      await refreshTransactions();
      
      toast({
        title: 'Profit Claimed!',
        description: `You received $${result.profit.toFixed(2)} (6x profit)`
      });
    }
    
    return result;
  };

  // ===========================================
  // DATA FUNCTIONS
  // ===========================================
  
  const refreshTransactions = async (): Promise<void> => {
    if (!user) return;
    
    // For training accounts, use localStorage wallet state only (skip Supabase)
    if (user.account_type === 'training') {
      setTransactions([]);
      return;
    }
    
    // For personal/admin accounts, load from Supabase
    try {
      const dbTransactions = await SupabaseService.getUserTransactions(user.id);
      setTransactions((dbTransactions || []).map(mapDatabaseTransactionToTransaction));
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      setTransactions([]);
    }
  };

  const addWallet = async (walletAddress: string, walletType: string): Promise<boolean> => {
    console.log('[addWallet] Function called', { walletAddress, walletType, userId: user?.id });
    if (!user) {
      console.log('[addWallet] No user found, returning false');
      return false;
    }

    try {
      console.log('[addWallet] Checking for existing wallets');
      // Check if wallet already exists for this user
      const { data: existingWallets, error: checkError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('wallet_address', walletAddress);

      console.log('[addWallet] Existing wallet check completed', { existingWallets, checkError });

      if (checkError) {
        console.error('[Wallet Check Error]', checkError);
        toast({ title: 'Error', description: 'Failed to check existing wallets', variant: 'destructive' });
        return false;
      }

      if (existingWallets && existingWallets.length > 0) {
        console.log('[Wallet Duplicate] Wallet already exists', { userId: user.id, walletAddress });
        toast({ title: 'Wallet Already Exists', description: 'This wallet address is already bound to your account', variant: 'destructive' });
        return false;
      }

      // Determine chain based on wallet type
      const chain = walletType === 'USDT-TRC20' ? 'TRON' :
                    walletType === 'USDT-ERC20' ? 'ETH' :
                    walletType === 'USDT-BEP20' ? 'BSC' :
                    'ETH';

      const insertPayload = {
        user_id: user.id,
        wallet_address: walletAddress,
        wallet_type: walletType,
        chain: chain,
        is_primary: wallets.length === 0
      };

      console.log('[Wallet Insert] About to insert wallet with payload', insertPayload);

      const { error } = await supabase
        .from('wallets')
        .insert(insertPayload);

      console.log('[Wallet Insert] Insert completed', { error });

      if (error) {
        console.error('[Wallet Insert Error]', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      }

      console.log('[Wallet Bound Success]', { userId: user.id, walletAddress, walletType, chain });

      console.log('[addWallet] About to update users table with wallet_address');
      // Update wallet_address on users table (only column that exists in schema)
      await supabase
        .from('users')
        .update({
          wallet_address: walletAddress
        })
        .eq('id', user.id);

      console.log('[addWallet] Users table update completed');

      console.log('[addWallet] About to refresh wallets');
      await refreshWallets();

      console.log('[addWallet] Wallets refreshed, about to refresh user');
      await refreshUser(); // Refresh user to get updated wallet_bound status

      console.log('[addWallet] User refreshed, about to show success toast');

      toast({
        title: 'Wallet Added',
        description: 'Your wallet has been added successfully'
      });

      console.log('[addWallet] Returning true');
      return true;
    } catch (error: any) {
      console.error('[Wallet Insert Exception]', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const refreshWallets = async (): Promise<void> => {
    if (!user) return;
    
    // For training accounts, use localStorage wallet state only (skip Supabase)
    if (user.account_type === 'training') {
      setWallets([]);
      return;
    }
    
    // For personal/admin accounts, load from Supabase
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching wallets:', error);
        return;
      }
      
      setWallets(data as Wallet[]);
    } catch (error) {
      console.error('Exception fetching wallets:', error);
    }
  };

  // ===========================================
  // WITHDRAWAL FUNCTIONS
  // ===========================================
  
  const requestWithdrawal = async (
    amount: number,
    walletAddress: string,
    walletType: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Validate withdrawal eligibility
    if (!walletState.hasWallet) {
      return { success: false, error: 'Please bind a wallet address first' };
    }
    
    // Get current balance from user state
    const currentBalance = user.balance || 0;
    if (amount > currentBalance) {
      return { success: false, error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` };
    }
    
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }
    
    // Check if training account has completed both phases
    const isTraining = user.account_type === 'training';
    if (isTraining) {
      // Get training account to check task completion
      const training = await SupabaseService.getTrainingAccountByAuthId(user.id);
      if (!training || training.task_number < 45) {
        return { success: false, error: 'Please complete all training tasks before withdrawing' };
      }
      if (user.training_phase !== 2) {
        return { success: false, error: 'Training not completed. Please finish Phase 2.' };
      }
    }
    
    // Create withdrawal request
    const result = await SupabaseService.createWithdrawalRequest({
      userId: user.id,
      email: user.email,
      amount,
      walletAddress,
      walletType,
      currentBalance
    });
    
    if (result.success) {
      // Refresh user data to get updated state
      await refreshUser();
      
      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal request of $${amount.toFixed(2)} has been submitted for admin approval.`,
      });
    } else {
      toast({
        title: 'Withdrawal Failed',
        description: result.error || 'Failed to submit withdrawal request',
        variant: 'destructive'
      });
    }
    
    return result;
  };
  
  const getWithdrawalHistory = async (): Promise<any[]> => {
    if (!user) return [];
    return await SupabaseService.getUserWithdrawals(user.id);
  };
  
  const hasPendingWithdrawal = async (): Promise<boolean> => {
    if (!user) return false;
    return await SupabaseService.hasPendingWithdrawal(user.id);
  };

  // ===========================================
  // PROVIDER VALUE
  // ===========================================
  
  const value: AppContextType = {
    user,
    tasks,
    transactions,
    wallets,
    taskHistory,
    walletState,
    isAuthenticated,
    isLoading,
    authLoading,
    activeTab,
    setActiveTab,
    
    // Auth Modal UI State
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    
    // Auth
    login,
    loginTrainingAccount,
    register,
    logout,
    
    // Tasks
    completeTask,
    refreshTasks,
    
    // User
    refreshUser,
    refreshApp,
    updateUser,
    
    // Pending Order
    createPendingOrder,
    clearPendingOrderAndClaimProfit,
    
    // Data
    refreshTransactions,
    addWallet,
    refreshWallets,
    
    // Withdrawals
    requestWithdrawal,
    getWithdrawalHistory,
    hasPendingWithdrawal
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Backward compatibility alias
export const useAppContext = useApp;
