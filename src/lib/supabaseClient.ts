import { createClient, SupabaseClient } from '@supabase/supabase-js';

// supabaseMain: User accounts, task metrics, front-end balances
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabaseMain = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'earnings-platform'
    },
    fetch: (url, options = {}) => {
      const fetchOptions = {
        ...options,
        credentials: 'omit' as RequestCredentials
      };
      return fetch(url, fetchOptions);
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// supabaseVault: Monetization logs, Solana yield splitting, Telegram webhooks
const vaultUrl = import.meta.env.VITE_SUPABASE_VAULT_URL || supabaseUrl;
const vaultAnonKey = import.meta.env.VITE_SUPABASE_VAULT_ANON_KEY || supabaseAnonKey;
export const supabaseVault = createClient(vaultUrl, vaultAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'earnings-platform'
    },
    fetch: (url, options = {}) => {
      const fetchOptions = {
        ...options,
        credentials: 'omit' as RequestCredentials
      };
      return fetch(url, fetchOptions);
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Default export for backward compatibility
export const supabase = supabaseMain;
export default supabaseMain;

// ================= DATABASE TYPES =================
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          phone: string | null
          password_hash: string
          balance: number
          total_earned: number
          vip_level: number
          account_type: string
          user_status: string
          training_completed: boolean
          training_progress: number
          training_phase: number
          tasks_completed: number
          trigger_task_number: number | null
          has_pending_order: boolean
          pending_amount: number
          is_negative_balance: boolean
          profit_added: boolean
          pending_product: any
          current_task_set: number
          set_1_completed_at: string | null
          set_2_completed_at: string | null
          referral_code: string | null
          referred_by: string | null
          training_phase_2_checkpoint: any
          training_completed_v2: boolean
          commission_transferred: boolean
          commission_transfer_amount: number
          commission_transferred_at: string | null
          training_phase_1_locked: boolean
          training_phase_1_locked_at: string | null
          tasks_locked: boolean
          linked_training_account_id: string | null
          created_at: string
          updated_at: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          task_number: number
          reward: number
          status: 'pending' | 'completed' | 'locked'
          created_at: string
          completed_at: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'earning' | 'withdrawal' | 'task_reward' | 'commission_transfer'
          amount: number
          description: string
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
      }
      training_accounts: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          password: string
          display_name: string
          status: string
          progress: number
          total_tasks: number
          task_number: number
          amount: number
          product_name: string
          commission: number
          completed: boolean
          assigned_to: string
          created_by: string
          created_at: string
          updated_at: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          action: string
          user_id: string
          admin_id?: string
          details?: any
          ip_address?: string
          created_at?: string
        }
      }
      creator_videos: {
        Row: {
          id: string
          creator_id: string
          title: string
          video_url: string
          thumbnail_url: string
          creator_name: string
          views: number
          likes_count: number
          comments_count: number
          is_premium: boolean
          unlock_cost: number
          created_at: string
        }
      }
      phase2_checkpoints: {
        Row: {
          id: string
          user_id: string
          auth_user_id: string
          email: string
          phase: number
          task_number: number
          status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'completed' | 'submitted' | 'bonus_paid'
          product1_name: string
          product1_image: string
          product1_price: number
          product2_name: string
          product2_image: string
          product2_price: number
          combination_value: number
          bonus_amount: number
          reviewed_by?: string
          reviewed_at?: string
          notes?: string
          created_at: string
          updated_at: string
        }
      }
      personal_day2_checkpoints: {
        Row: {
          id: string
          user_id: string
          auth_user_id: string
          email: string
          cycle: number
          task_number: number
          status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'completed' | 'submitted' | 'bonus_paid'
          product1_name: string
          product1_image: string
          product1_price: number
          product2_name: string
          product2_image: string
          product2_price: number
          combination_value: number
          bonus_amount: number
          reviewed_by?: string
          reviewed_at?: string
          submitted_at?: string
          approved_at?: string
          notes?: string
          created_at: string
          updated_at: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          user_email: string
          amount: number
          wallet_address: string
          wallet_type: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          balance_snapshot: number
          reviewed_by?: string
          processed_at?: string
          notes?: string
          created_at: string
          updated_at: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
      }
      influencer_referrals: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          referred_user_id?: string
          revenue: number
          status: string
          created_at: string
        }
      }
      training_settings: {
        Row: {
          id: string
          checkpoint_multiplier: number
          training_completion_percentage: number
          phase2_target_final_balance: number
          checkpoint_bonus_mode: string
          updated_at: string
        }
      }
      tiktok_referrals: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          referred_user_id?: string
          source: string
          status: string
          created_at: string
        }
      }
    }
  }
}
