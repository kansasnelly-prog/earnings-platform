import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = [
  "https://earnings-ink.vercel.app",
  "http://localhost:3000",
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
const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

// ===== MAIN HANDLER =====
serve(async (req) => {
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
      default:
        console.log(`[auth-handler] Invalid action: ${action}`)
        return jsonResponse({ 
          success: false, 
          error: `Invalid action: ${action}. Allowed: register, login, get_tasks` 
        }, 400, origin)
    }
  } catch (error) {
    console.error('[auth-handler] Unexpected error:', error.message)
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
  } catch (err: any) {
    console.error('[auth-handler] Register error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Registration failed' 
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
  } catch (err: any) {
    console.error('[auth-handler] Login error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Login failed' 
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
  } catch (err: any) {
    console.error('[auth-handler] Get tasks error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to fetch tasks' 
    }, 500, origin)
  }
}
