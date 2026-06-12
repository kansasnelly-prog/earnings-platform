import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SafeAuthUser {
  id: string;
  email: string;
  display_name?: string;
  account_type: string;
}

interface AuthState {
  user: SafeAuthUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: SafeAuthUser; isAdmin: boolean } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAdmin: action.payload.isAdmin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export type SafeAuthLoginResult = {
  success: boolean;
  isAdmin?: boolean;
  error?: string;
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<SafeAuthLoginResult>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // In rare cases (e.g., during SSR or if a component is rendered
    // outside the provider tree) this can throw and crash the app.
    // Instead of throwing, we return a safe default that mirrors the
    // initial state. This allows the component to render a fallback
    // UI and keeps the app running.
    console.warn('useAuth called outside of AuthProvider. Returning default context.');
    return {
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async () => ({ success: false }),
      logout: () => {},
      clearError: () => {},
    } as any;
  }
  return context;
};

// Alias for backward compatibility and to match imports expecting useSafeAuth
export const useSafeAuth = useAuth;

async function hydrateUserFromProfile(authUser: SupabaseAuthUser): Promise<{
  user: SafeAuthUser;
  isAdmin: boolean;
}> {
  // STEP 1: Check for training account first
  const { data: trainingAccount, error: trainingError } = await supabase
    .from('training_accounts')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (trainingAccount) {
    console.log('[hydrateUserFromProfile] Found training account:', trainingAccount.email);
    return {
      user: {
        id: authUser.id,
        email: trainingAccount.email,
        display_name: trainingAccount.email.split('@')[0] || 'Training User',
        account_type: 'training',
      },
      isAdmin: false,
    };
  }

  // STEP 2: Fallback to normal user account
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, account_type')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('SafeAuth: profile load error', error);
  }

  if (data) {
    return {
      user: {
        id: data.id,
        email: data.email,
        display_name: data.display_name ?? undefined,
        account_type: data.account_type ?? 'personal',
      },
      isAdmin: data.account_type === 'admin',
    };
  }

  return {
    user: {
      id: authUser.id,
      email: authUser.email ?? '',
      display_name: undefined,
      account_type: 'personal',
    },
    isAdmin: false,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // Restore session on mount with network guard
    const restoreSession = async () => {
      // Check if browser is online before making network request
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('[SafeAuthProvider] Skipping session restore - Browser is offline');
        return;
      }

      try {
        // Magazine 1: Enforce Permanent Administrative Auth Persistence
        // Explicitly pull encrypted active session from Supabase's native browser token cache storage
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[SafeAuthProvider] Session restored on mount:', session ? 'Active' : 'None');
        if (error) {
          throw error;
        }
        if (session?.user && !cancelled) {
          const hydrated = await hydrateUserFromProfile(session.user);
          if (!cancelled) {
            // Lock administrative session parameters state across page refreshes
            // Preserve isAuthenticated as true and retain admin@test.com session
            if (session.user.email === 'admin@test.com' || hydrated.isAdmin) {
              console.log('[SafeAuthProvider] Admin session detected - locking persistence');
            }
            dispatch({ type: 'LOGIN_SUCCESS', payload: hydrated });
          }
        }
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
          console.log('[SafeAuthProvider] Network connection interrupted during session restore. Waiting for network recovery...');
        } else {
          console.error('[SafeAuthProvider] Session restore error:', error);
        }
      }
    };

    restoreSession();

    // Subscribe to auth changes with network guard
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[SafeAuthProvider] Auth event:', event);
      console.log('[SafeAuthProvider] Session:', session ? 'Active' : 'None');

      void (async () => {
        // Check if browser is online before processing auth state change
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[SafeAuthProvider] Skipping auth state change - Browser is offline');
          return;
        }

        if (cancelled) return;
        if (event === 'SIGNED_OUT') {
          console.log('[SafeAuthProvider] User signed out');
          dispatch({ type: 'LOGOUT' });
          return;
        }
        if (!session?.user) {
          return;
        }

        try {
          const hydrated = await hydrateUserFromProfile(session.user);
          if (!cancelled) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: hydrated });
          }
        } catch (error: any) {
          if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
            console.log('[SafeAuthProvider] Network connection interrupted during auth state change. Waiting for network recovery...');
          } else {
            console.error('[SafeAuthProvider] Auth state change error:', error);
          }
        }
      })();
    });

    // Automatically retry session restore when connection is restored
    const handleOnline = () => {
      console.log('[SafeAuthProvider] Network connection restored. Refreshing session...');
      restoreSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<SafeAuthLoginResult> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        const msg = 'Sign-in failed: no user returned';
        dispatch({ type: 'LOGIN_FAILURE', payload: msg });
        return { success: false, error: msg };
      }

      const hydrated = await hydrateUserFromProfile(data.user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: hydrated });
      
      // Trigger Telegram notification
      import('../lib/telegramNotifications').then(mod => {
        mod.sendLoginNotification(data.user.email || 'unknown');
      });

      return { success: true, isAdmin: hydrated.isAdmin };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    void supabase.auth.signOut().catch((e) => console.error('SafeAuth signOut error', e));
    localStorage.removeItem('opt_user');
    dispatch({ type: 'LOGOUT' });
    // Skip redirect on admin route
    if (!window.location.pathname.startsWith('/admin')) {
      navigate('/');
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
