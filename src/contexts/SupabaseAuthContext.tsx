// Updated import to avoid default React import which requires esModuleInterop
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SecurityManager } from '../utils/security';
// Use the full SupabaseService which provides all required methods
import { SupabaseService, DatabaseUser, DatabaseTask } from '../services/supabaseService';

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
  | { type: 'USER_UPDATED'; payload: DatabaseUser };

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
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  completeTask: (taskNumber: number) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
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

      // Load user tasks
      const tasks = await SupabaseService.getUserTasks(user.id);

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
      const result = await SupabaseService.completeTask(state.user.id, taskNumber);
      if (!result.success) {
        toast.error(result.error || 'Failed to complete task');
        return false;
      }

      SecurityManager.logAction('TASK_COMPLETED', state.user.email, {
        taskNumber,
        reward: result.reward,
      });

      toast.success(`Task ${taskNumber} completed! Earned $${result.reward?.toFixed(2)}`);
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

  // Admin protection
  const requireAdminAccess = () => {
    return state.isAdmin;
  };

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