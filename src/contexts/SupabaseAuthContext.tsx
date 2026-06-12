// @ts-ignore: Suppress default import warning without esModuleInterop
1 | import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SecurityManager } from '../utils/security';
5 | // Use the full SupabaseService which provides all required methods
5 | import { SupabaseService, DatabaseUser, DatabaseTask } from '../services/supabaseService';

interface AuthState {
  user: DatabaseUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tasks: DatabaseTask[];
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: DatabaseUser; isAdmin: boolean; tasks?: DatabaseTask[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'TASKS_LOADED'; payload: DatabaseTask[] }
  | { type: 'TASK_UPDATED'; payload: DatabaseTask }
  | { type: 'USER_UPDATED'; payload: DatabaseUser }
  | { type: 'BALANCE_SYNCED'; payload: number };

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tasks: [],
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAdmin: action.payload.isAdmin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tasks: action.payload.tasks || [],
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        tasks: [],
      };
    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tasks: [],
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'TASKS_LOADED':
      return {
        ...state,
        tasks: action.payload,
      };
    case 'TASK_UPDATED':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'USER_UPDATED':
      return {
        ...state,
        user: action.payload,
      };
    case 'BALANCE_SYNCED':
      return {
        ...state,
        user: state.user ? { ...state.user, balance: action.payload } : null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  completeTask: (taskId: number) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  syncBalance: () => Promise<void>;
  requireAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Real-time subscriptions
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [taskSubscription, setTaskSubscription] = useState<any>(null);

  // Secure login function with Supabase integration
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Validate inputs
      if (!email || !password || !email.includes('@')) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' });
        return false;
      }

      // Check admin credentials first
      if (email === 'admin@optimize.com' && password === 'admin123') {
        const adminUser = await SupabaseService.getUserByEmail(email);
        
        if (!adminUser) {
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Admin account not found in database' });
          return false;
        }

        // Validate admin user data
        const validation = await SupabaseService.validateUserIntegrity(adminUser.id);
        if (!validation.isValid) {
          console.warn('Admin data validation issues:', validation.issues);
        }

        // Update last login
        await SupabaseService.updateUserLastLogin(adminUser.id);

        // Create secure session
        SecurityManager.createSession(adminUser, true);
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: adminUser, isAdmin: true } 
        });
        
        return true;
      }

      // Check for user in Supabase
      const user = await SupabaseService.getUserByEmail(email.toLowerCase());
      
      if (!user) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Account not found' });
        return false;
      }

      // Validate password
      if (user.password !== password) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid credentials' });
        return false;
      }

      // Validate user data integrity
      const validation = await SupabaseService.validateUserIntegrity(user.id);
      if (!validation.isValid) {
        console.warn('User data validation issues:', validation.issues);
        
        // Auto-correct balance if needed
        if (validation.correctedBalance !== undefined) {
          await SupabaseService.updateUser(user.id, { balance: validation.correctedBalance });
          user.balance = validation.correctedBalance;
        }
      }

      // Load user tasks
      const tasks = await SupabaseService.getUserTasks(user.id);

      // Update last login
      await SupabaseService.updateUserLastLogin(user.id);

      // Create secure session
      SecurityManager.createSession(user, user.account_type === 'admin');
      
      // Store minimal data in localStorage for offline support
      localStorage.setItem('opt_user', JSON.stringify(user));
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user, 
          isAdmin: user.account_type === 'admin',
          tasks 
        } 
      });
      
      return true;

    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed' });
      return false;
    }
  };

  // Secure logout
  const logout = () => {
    // Cleanup subscriptions
    if (userSubscription) {
      SupabaseService.unsubscribe(userSubscription);
      setUserSubscription(null);
    }
    if (taskSubscription) {
      SupabaseService.unsubscribe(taskSubscription);
      setTaskSubscription(null);
    }

    SecurityManager.destroySession();
    localStorage.removeItem('opt_user');
    dispatch({ type: 'LOGOUT' });
    // Skip redirect on admin route
    if (!window.location.pathname.startsWith('/admin')) {
      navigate('/');
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Complete task with server-side validation
  const completeTask = async (taskNumber: number): Promise<boolean> => {
    if (!state.user) return false;

    try {
      // Find the task
      const task = state.tasks.find(t => t.task_number === taskNumber);
      if (!task || task.status !== 'pending') {
        toast.error('Task not available for completion');
        return false;
      }

      // Complete task in database
      const completedTask = await SupabaseService.completeTask(task.id);
      if (!completedTask) {
        toast.error('Failed to complete task');
        return false;
      }

      // Update user stats
      const newTasksCompleted = state.user.tasks_completed + 1;
      const newBalance = state.user.balance + task.reward;
      const newTotalEarned = state.user.total_earned + task.reward;

      const updatedUser = await SupabaseService.updateUser(state.user.id, {
        tasks_completed: newTasksCompleted,
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      });

      if (!updatedUser) {
        toast.error('Failed to update user stats');
        return false;
      }

      // Unlock next task
      await SupabaseService.unlockNextTask(state.user.id, taskNumber);

      // Create transaction record
      await SupabaseService.createTransaction({
        user_id: state.user.id,
        type: 'deposit',
        amount: task.reward,
        status: 'completed',
        description: `Task ${taskNumber} completion reward`
      });

      // Log activity
      SecurityManager.logAction('TASK_COMPLETED', state.user.email, {
        taskNumber,
        reward: task.reward,
        newBalance
      });

      // Update local state
      dispatch({ type: 'TASK_UPDATED', payload: completedTask });
      dispatch({ type: 'USER_UPDATED', payload: updatedUser });

      toast.success(`Task ${taskNumber} completed! Earned $${task.reward.toFixed(2)}`);
      return true;

    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
      return false;
    }
  };

  // Refresh user data from database
  const refreshUserData = async () => {
    if (!state.user) return;

    try {
      const [updatedUser, updatedTasks] = await Promise.all([
        SupabaseService.getUserByEmail(state.user.email),
        SupabaseService.getUserTasks(state.user.id)
      ]);

      if (updatedUser) {
        dispatch({ type: 'USER_UPDATED', payload: updatedUser });
        localStorage.setItem('opt_user', JSON.stringify(updatedUser));
      }

      if (updatedTasks) {
        dispatch({ type: 'TASKS_LOADED', payload: updatedTasks });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Sync balance from server
  const syncBalance = async () => {
    if (!state.user) return;

    try {
      const syncedUser = await SupabaseService.syncUserBalance(state.user.id);
      if (syncedUser) {
        dispatch({ type: 'BALANCE_SYNCED', payload: syncedUser.balance });
        localStorage.setItem('opt_user', JSON.stringify(syncedUser));
        toast.success('Balance synced with server');
      }
    } catch (error) {
      console.error('Error syncing balance:', error);
      toast.error('Failed to sync balance');
    }
  };

  // Admin protection
  const requireAdminAccess = () => {
    return state.isAdmin;
  };

  // Setup real-time subscriptions
  useEffect(() => {
    let userSub: any = null;
    let taskSub: any = null;

    if (state.isAuthenticated && state.user) {
      // Subscribe to user changes
      userSub = SupabaseService.subscribeToUserChanges(state.user.id, (updatedUser) => {
        dispatch({ type: 'USER_UPDATED', payload: updatedUser });
        localStorage.setItem('opt_user', JSON.stringify(updatedUser));
      });
      setUserSubscription(userSub);

      // Subscribe to task changes
      taskSub = SupabaseService.subscribeToTaskChanges(state.user.id, (updatedTask) => {
        dispatch({ type: 'TASK_UPDATED', payload: updatedTask });
      });
      setTaskSubscription(taskSub);
    }

    return () => {
      if (userSub) {
        SupabaseService.unsubscribe(userSub);
      }
      if (taskSub) {
        SupabaseService.unsubscribe(taskSub);
      }
    };
  }, [state.isAuthenticated, state.user?.id]);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      // Check if session exists in memory
      const session = SecurityManager.getSession();
      if (session) {
        // Refresh user data from database
        const user = await SupabaseService.getUserByEmail(session.user.email);
        if (user && SecurityManager.validateUserData(user)) {
          const tasks = await SupabaseService.getUserTasks(user.id);
          
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { user, isAdmin: session.isAdmin, tasks } 
          });
          return;
        }
      }

      // Try to restore from localStorage (offline support)
      const userData = localStorage.getItem('opt_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (SecurityManager.validateUserData(user)) {
            // Validate with database
            const dbUser = await SupabaseService.getUserByEmail(user.email);
            if (dbUser) {
              const tasks = await SupabaseService.getUserTasks(dbUser.id);
              
              SecurityManager.createSession(dbUser, dbUser.account_type === 'admin');
              
              dispatch({ 
                type: 'LOGIN_SUCCESS', 
                payload: { user: dbUser, isAdmin: dbUser.account_type === 'admin', tasks } 
              });
            }
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          dispatch({ type: 'SESSION_EXPIRED' });
        }
      }
    };

    validateSession();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    completeTask,
    refreshUserData,
    syncBalance,
    requireAdmin: requireAdminAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Admin route protection component
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      SecurityManager.logAction('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT');
      logout();
      navigate('/');
    }
  }, [isAdmin, logout, navigate]);

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};
