import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log("=== SUPABASE CONFIGURATION ===")
console.log("SUPABASE URL:", supabaseUrl)
console.log("Expected Production URL: https://ybxshqzwirqfybdeukvq.supabase.co")
console.log("URL Match:", supabaseUrl === "https://ybxshqzwirqfybdeukvq.supabase.co" ? "✓ CORRECT" : "✗ INCORRECT")
console.log("================================")

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage,
    flowType: 'pkce',
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'earnings-platform'
    },
    fetch: (url, options = {}) => {
      // Avoid sending credentials for non-auth requests to prevent Cloudflare cookie issues
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
})
export default supabase;

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
          email: string
          password: string
          assigned_to: string
          created_by: string
          status: string
          created_at: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          action: string
          user_id: string
          details: any
          created_at: string
        }
      }
    }
  }
}