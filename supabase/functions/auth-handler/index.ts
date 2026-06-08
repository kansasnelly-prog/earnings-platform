// @ts-nocheck
// Deno Edge Function - runs on Supabase Edge Runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = [
  "https://earnings-ink.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8087",
  "http://localhost:8088",
];

function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
  };
}

// Helper to create JSON response with CORS
function jsonResponse(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: getCorsHeaders(origin)
  })
}

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Generate helpers
const generateId = () => crypto.randomUUID()
const generateReferralCode = () => `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

// ===== MAIN HANDLER =====
serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const method = req.method
  
  console.log(`[auth-handler] ${method} request from origin: ${origin || 'unknown'}`)
  
  // Handle OPTIONS preflight immediately
  if (method === 'OPTIONS') {
    console.log('[auth-handler] Handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200, 
      headers: getCorsHeaders(origin) 
    })
  }
  
  // Only allow POST for actions
  if (method !== 'POST') {
    console.log(`[auth-handler] Method not allowed: ${method}`)
    return jsonResponse({ 
      success: false, 
      error: `Method ${method} not allowed. Use POST.` 
    }, 405, origin)
  }
  
  try {
    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.log('[auth-handler] Failed to parse JSON body')
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON body' 
      }, 400, origin)
    }
    
    const { action } = body
    console.log(`[auth-handler] Action: ${action}`)
    
    // Route to handler based on action
    switch (action) {
      case 'register':
        return await handleRegister(body, origin)
      case 'login':
        return await handleLogin(body, origin)
      case 'get_tasks':
        return await handleGetTasks(req, origin)
      // Admin actions
      case 'get_users':
        return await handleGetUsers(req, origin)
      case 'get_withdrawals':
        return await handleGetWithdrawals(req, origin)
      case 'get_wallets':
        return await handleGetWallets(req, origin)
      case 'get_dashboard_stats':
        return await handleGetDashboardStats(origin)
      case 'approve_withdrawal':
        return await handleApproveWithdrawal(body, origin)
      case 'reject_withdrawal':
        return await handleRejectWithdrawal(body, origin)
      default:
        console.log(`[auth-handler] Invalid action: ${action}`)
        return jsonResponse({ 
          success: false, 
          error: `Invalid action: ${action}. Allowed: register, login, get_tasks, get_users, get_withdrawals, get_wallets, get_dashboard_stats, approve_withdrawal, reject_withdrawal` 
        }, 400, origin)
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[auth-handler] Unexpected error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: 'Internal server error' 
    }, 500, origin)
  }
})

async function handleRegister(body: any, origin: string | null) {
  const { email, password, displayName, phone } = body
  
  try {
    console.log(`[auth-handler] Register: ${email}`)
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
    
    if (existingUser) {
      console.log('[auth-handler] User already exists:', email)
      return jsonResponse({ 
        success: false, 
        error: 'User already exists' 
      }, 400, origin)
    }

    // Create new user
    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      phone: phone || null,
      display_name: displayName || email.split('@')[0],
      vip_level: 1,
      balance: 0,
      total_earned: 0,
      referral_code: generateReferralCode(),
      account_type: 'personal',
      user_status: 'registered',
      training_completed: false,
      training_progress: 0,
      training_phase: 1,
      tasks_completed: 0,
      trigger_task_number: null,
      has_pending_order: false,
      pending_amount: 0,
      is_negative_balance: false,
      profit_added: false
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (error) {
      console.error('[auth-handler] Error creating user:', error.message)
      throw error
    }

    // Create 35 personal tasks
    const tasks = Array.from({ length: 35 }, (_, i) => ({
      user_id: user.id,
      task_number: i + 1,
      status: i === 0 ? 'pending' : 'locked',
      reward: Math.floor(Math.random() * 20) + 10
    }))

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)

    if (tasksError) {
      console.error('[auth-handler] Error creating tasks:', tasksError.message)
      throw tasksError
    }

    console.log('[auth-handler] User registered successfully:', email)
    return jsonResponse({ 
      success: true,
      user,
      message: 'Account created successfully' 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Register error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Registration failed' 
    }, 500, origin)
  }
}

async function handleLogin(body: any, origin: string | null) {
  const { email, password } = body
  
  try {
    console.log(`[auth-handler] Login: ${email}`)
    
    // Special admin login
    if (email === 'admin@optimize.com' && password === 'admin123') {
      console.log('[auth-handler] Admin login successful')
      const adminUser = {
        id: 'admin-001',
        email: 'admin@optimize.com',
        display_name: 'Admin',
        vip_level: 2,
        balance: 0,
        total_earned: 0,
        referral_code: 'ADMIN',
        account_type: 'admin',
        user_status: 'active',
        training_completed: true
      }
      
      return jsonResponse({ 
        success: true, 
        user: adminUser 
      }, 200, origin)
    }

    // Check user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      console.log('[auth-handler] User not found:', email)
      return jsonResponse({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401, origin)
    }

    // Check training account
    const { data: trainingAccount } = await supabase
      .from('training_accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .single()

    if (trainingAccount) {
      console.log('[auth-handler] Training account login:', email)
      const trainingUser = {
        id: generateId(),
        email: trainingAccount.email,
        display_name: trainingAccount.assigned_to || 'Training User',
        vip_level: 0,
        balance: 1100,
        total_earned: 0,
        referral_code: generateReferralCode(),
        account_type: 'training',
        user_status: 'active',
        training_completed: false,
        training_progress: 0,
        training_phase: 1,
        tasks_completed: 0,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false
      }

      return jsonResponse({ 
        success: true, 
        user: trainingUser 
      }, 200, origin)
    }

    console.log('[auth-handler] Regular user login:', email)
    return jsonResponse({ 
      success: true, 
      user 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Login error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Login failed' 
    }, 500, origin)
  }
}

async function handleGetTasks(req: Request, origin: string | null) {
  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!authToken) {
      return jsonResponse({ 
        success: false, 
        error: 'Missing authorization token' 
      }, 401, origin)
    }
    
    // Verify user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      console.log('[auth-handler] Unauthorized: invalid token')
      return jsonResponse({ 
        success: false, 
        error: 'Unauthorized' 
      }, 401, origin)
    }

    // Get tasks from database
    const { data: tasks, error: dbError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('task_number')

    if (dbError) {
      console.error('[auth-handler] Error fetching tasks:', dbError.message)
      throw dbError
    }

    console.log(`[auth-handler] Get tasks for user: ${user.id}, count: ${tasks?.length || 0}`)
    return jsonResponse({ 
      success: true, 
      tasks 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Get tasks error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to fetch tasks' 
    }, 500, origin)
  }
}

// ===== ADMIN HANDLERS =====

async function handleGetUsers(req: Request, origin: string | null) {
  try {
    console.log('[auth-handler] Getting all users')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[auth-handler] Error fetching users:', error.message)
      throw error
    }

    console.log(`[auth-handler] Found ${users?.length || 0} users`)
    return jsonResponse({ 
      success: true, 
      users: users || [] 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Get users error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to fetch users' 
    }, 500, origin)
  }
}

async function handleGetWithdrawals(req: Request, origin: string | null) {
  try {
    console.log('[auth-handler] Getting all withdrawals')
    
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[auth-handler] Error fetching withdrawals:', error.message)
      throw error
    }

    console.log(`[auth-handler] Found ${withdrawals?.length || 0} withdrawals`)
    return jsonResponse({ 
      success: true, 
      withdrawals: withdrawals || [] 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Get withdrawals error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to fetch withdrawals' 
    }, 500, origin)
  }
}

async function handleGetWallets(req: Request, origin: string | null) {
  try {
    console.log('[auth-handler] Getting all wallets')
    
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')

    if (error) {
      console.error('[auth-handler] Error fetching wallets:', error.message)
      throw error
    }

    console.log(`[auth-handler] Found ${wallets?.length || 0} wallets`)
    return jsonResponse({ 
      success: true, 
      wallets: wallets || [] 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Get wallets error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to fetch wallets' 
    }, 500, origin)
  }
}

async function handleGetDashboardStats(origin: string | null) {
  try {
    console.log('[auth-handler] Getting dashboard stats')
    
    // Get counts and sums
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, balance, tasks_completed, created_at, last_login')
    
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('amount, status')
    
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status')

    if (usersError || withdrawalsError || tasksError) {
      throw new Error('Failed to fetch stats')
    }

    const today = new Date().toISOString().split('T')[0]
    
    const stats = {
      totalUsers: users?.length || 0,
      totalBalance: users?.reduce((sum: number, u: any) => sum + (u.balance || 0), 0) || 0,
      totalPayouts: withdrawals?.filter((w: any) => w.status === 'completed').reduce((sum: number, w: any) => sum + (w.amount || 0), 0) || 0,
      pendingPayouts: withdrawals?.filter((w: any) => w.status === 'pending').reduce((sum: number, w: any) => sum + (w.amount || 0), 0) || 0,
      completedTasks: tasks?.filter((t: any) => t.status === 'completed').length || 0,
      pendingWithdrawals: withdrawals?.filter((w: any) => w.status === 'pending').length || 0,
      newUsersToday: users?.filter((u: any) => u.created_at?.startsWith(today)).length || 0,
      activeToday: users?.filter((u: any) => u.last_login?.startsWith(today)).length || 0
    }

    console.log('[auth-handler] Dashboard stats:', stats)
    return jsonResponse({ 
      success: true, 
      stats 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Get dashboard stats error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to fetch dashboard stats' 
    }, 500, origin)
  }
}

async function handleApproveWithdrawal(body: any, origin: string | null) {
  const { withdrawalId } = body
  
  try {
    console.log('[auth-handler] Approving withdrawal:', withdrawalId)
    
    const { data, error } = await supabase
      .from('withdrawals')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (error) {
      console.error('[auth-handler] Error approving withdrawal:', error.message)
      throw error
    }

    console.log('[auth-handler] Withdrawal approved:', withdrawalId)
    return jsonResponse({ 
      success: true, 
      withdrawal: data,
      message: 'Withdrawal approved successfully'
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Approve withdrawal error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to approve withdrawal' 
    }, 500, origin)
  }
}

async function handleRejectWithdrawal(body: any, origin: string | null) {
  const { withdrawalId, reason } = body
  
  try {
    console.log('[auth-handler] Rejecting withdrawal:', withdrawalId)
    
    const { data, error } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'rejected', 
        processed_at: new Date().toISOString(),
        rejection_reason: reason || 'Rejected by admin'
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (error) {
      console.error('[auth-handler] Error rejecting withdrawal:', error.message)
      throw error
    }

    console.log('[auth-handler] Withdrawal rejected:', withdrawalId)
    return jsonResponse({ 
      success: true, 
      withdrawal: data,
      message: 'Withdrawal rejected successfully'
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auth-handler] Reject withdrawal error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to reject withdrawal' 
    }, 500, origin)
  }
}
