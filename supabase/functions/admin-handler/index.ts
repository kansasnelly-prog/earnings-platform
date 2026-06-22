// @ts-nocheck
// Deno Edge Function - runs on Supabase Edge Runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = [
  "https://earnings.ink",
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

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const generateId = () => crypto.randomUUID()
const generatePassword = () => Math.floor(100000 + Math.random() * 900000).toString()

// ===== MAIN HANDLER =====
serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const method = req.method
  
  console.log(`[admin-handler] ${method} request from origin: ${origin || 'unknown'}`)
  
  // Handle OPTIONS preflight immediately
  if (method === 'OPTIONS') {
    console.log('[admin-handler] Handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200, 
      headers: getCorsHeaders(origin) 
    })
  }
  
  // Only allow POST for actions
  if (method !== 'POST') {
    console.log(`[admin-handler] Method not allowed: ${method}`)
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
      console.log('[admin-handler] Failed to parse JSON body')
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON body' 
      }, 400, origin)
    }
    
    const { action } = body
    console.log(`[admin-handler] Action: ${action}`)
    
    switch (action) {
      case 'get_users':
        return await handleGetUsers(origin)
      case 'create_training_account':
        return await handleCreateTrainingAccount(body, origin)
      case 'create_personal_account':
        return await handleCreatePersonalAccount(body, origin)
      case 'reset_training':
        return await handleResetTraining(body, origin)
      case 'upgrade_account':
        return await handleUpgradeAccount(body, origin)
      case 'complete_task':
        return await handleCompleteTask(body, origin)
      case 'get_user_data':
        return await handleGetUserData(body, origin)
      // Support wallet/task/withdrawal actions that frontend might send here
      case 'get_wallets':
        return jsonResponse({ success: true, wallets: [] }, 200, origin)
      case 'get_tasks':
        return await handleGetTasks(body, origin)
      case 'get_withdrawals':
        return jsonResponse({ success: true, withdrawals: [] }, 200, origin)
      default:
        console.log(`[admin-handler] Invalid action: ${action}`)
        return jsonResponse({ 
          success: false, 
          error: `Invalid action: ${action}` 
        }, 400, origin)
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin-handler] Unexpected error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: 'Internal server error' 
    }, 500, origin)
  }
})

async function handleGetUsers(origin: string | null) {
  try {
    console.log('[admin-handler] Getting users list')
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin-handler] Error getting users:', error.message)
      throw error
    }

    return jsonResponse({ success: true, users }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin-handler] Get users error:', errMsg)
    return jsonResponse({ success: false, error: errMsg }, 500, origin)
  }
}

async function handleCreateTrainingAccount(body: any, origin: string | null) {
  const email = body?.email?.toLowerCase()
  const assignedTo = body?.assignedTo || 'admin'
  const createdBy = body?.createdBy || 'admin'

  if (!email) {
    return jsonResponse({
      error: 'Email is required'
    }, 400, origin)
  }

  if (!body.password) {
    return jsonResponse({
      error: 'Password is required'
    }, 400, origin)
  }

  const password = body.password  

  try {
    console.log(`[admin-handler] Creating training account: ${email}`)

    // STEP 1: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

    let authUserId: string | null = null

    // HANDLE AUTH RESULT
    if (authError) {
      console.error('[admin-handler] Auth error:', authError.message)

      // If user already exists → fetch it
      if (authError.message?.includes('already been registered')) {
        console.log('[admin-handler] User exists, fetching...')

        const { data: existingUsers } =
          await supabaseAdmin.auth.admin.listUsers()

        const existingUser = existingUsers?.users?.find(
          (u: any) => u.email === email
        )

        if (!existingUser) {
          return jsonResponse({
            error: 'User exists but could not be found'
          }, 500, origin)
        }

        authUserId = existingUser.id
      } else {
        return jsonResponse({
          error: 'Failed to create auth user',
          details: authError.message
        }, 400, origin)
      }
    } else {
      authUserId = authData?.user?.id || null
    }

    // 🚨 CRITICAL SAFETY CHECK
    if (!authUserId) {
      return jsonResponse({
        error: 'User ID is null - cannot proceed'
      }, 500, origin)
    }

    console.log('[admin-handler] Auth user ID:', authUserId)

    // STEP 2: Insert into training_accounts
    const { data: trainingAccount, error } = await supabase
      .from('training_accounts')
     .insert({
  email,
  password,
  assigned_to: assignedTo,
  created_by: createdBy,
  status: 'active',
  auth_user_id: authUserId,
  task_number: 45,           
  product_name: 'training',
  amount: 1100,              
  commission: 0
}) 
      .select()
      .single()

    if (error) {
     console.error('[admin-handler] DB ERROR FULL:', error) 

      return jsonResponse({
        error: 'Failed to create training account',
        details: error.message
      }, 500, origin)
    }

    console.log('[admin-handler] Training account created:', email)

    return jsonResponse({
      success: true,
      trainingAccount,
      authUserId,
      message: 'Training account created successfully'
    }, 200, origin)

  } catch (err: any) {
    console.error('[admin-handler] UNEXPECTED ERROR:', err)

    return jsonResponse({
      success: false,
      error: err?.message || 'Unknown error'
    }, 500, origin)
  }
}

// Handle get tasks action (for get_tasks action in admin-handler)
async function handleGetTasks(body: any, origin: string | null) {
  const { userId } = body
  
  try {
    console.log(`[admin-handler] Getting tasks for user: ${userId}`)
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('task_number')

    if (error) {
      console.error('[admin-handler] Error getting tasks:', error.message)
      throw error
    }

    console.log(`[admin-handler] Retrieved ${tasks?.length || 0} tasks`)
    return jsonResponse({ 
      success: true, 
      tasks 
    }, 200, origin)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin-handler] Get tasks error:', errMsg)
    return jsonResponse({ 
      success: false, 
      error: errMsg || 'Failed to get tasks' 
    }, 500, origin)
  }
}
