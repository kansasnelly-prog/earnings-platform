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

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const generateId = () => crypto.randomUUID()
const generatePassword = () => Math.floor(100000 + Math.random() * 900000).toString()

// ===== MAIN HANDLER =====
serve(async (req) => {
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
  } catch (error) {
    console.error('[admin-handler] Unexpected error:', error.message)
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
  } catch (err: any) {
    console.error('[admin-handler] Get users error:', err.message)
    return jsonResponse({ success: false, error: err.message }, 500, origin)
  }
}

async function handleCreateTrainingAccount(body: any, origin: string | null) {
  const { email, assignedTo, createdBy } = body
  
  try {
    console.log(`[admin-handler] Creating training account: ${email}`)
    const password = generatePassword()
    
    const { data: trainingAccount, error } = await supabase
      .from('training_accounts')
      .insert({
        email: email.toLowerCase(),
        password,
        assigned_to: assignedTo,
        created_by: createdBy,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('[admin-handler] Error creating training account:', error.message)
      throw error
    }

    console.log('[admin-handler] Training account created:', email)
    return jsonResponse({ 
      success: true,
      trainingAccount,
      message: 'Training account created successfully' 
    }, 200, origin)
  } catch (err: any) {
    console.error('[admin-handler] Create training account error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to create training account' 
    }, 500, origin)
  }
}

async function handleCreatePersonalAccount(body: any, origin: string | null) {
  const { email, displayName, vipLevel } = body
  
  try {
    console.log(`[admin-handler] Creating personal account: ${email}`)
    
    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      display_name: displayName,
      vip_level: vipLevel,
      balance: 0,
      total_earned: 0,
      referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      account_type: 'personal',
      user_status: 'active',
      training_completed: true,
      training_progress: 100,
      training_phase: 2,
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
      console.error('[admin-handler] Error creating personal account:', error.message)
      throw error
    }

    // Create 35 personal tasks
    const tasks = Array.from({ length: 35 }, (_, i) => ({
      user_id: user.id,
      task_number: i + 1,
      status: i === 0 ? 'pending' : 'locked',
      reward: Math.floor(Math.random() * 20) + 10
    }))

    const { error: tasksError } = await supabase.from('tasks').insert(tasks)
    
    if (tasksError) {
      console.error('[admin-handler] Error creating tasks:', tasksError.message)
      throw tasksError
    }

    console.log('[admin-handler] Personal account created:', email)
    return jsonResponse({ 
      success: true,
      user,
      message: 'Personal account created successfully' 
    }, 200, origin)
  } catch (err: any) {
    console.error('[admin-handler] Create personal account error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to create personal account' 
    }, 500, origin)
  }
}

async function handleResetTraining(body: any, origin: string | null) {
  const { userId } = body
  
  try {
    console.log(`[admin-handler] Resetting training for user: ${userId}`)
    
    // Reset user training progress
    const { error } = await supabase
      .from('users')
      .update({
        training_progress: 0,
        training_phase: 1,
        tasks_completed: 0,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false
      })
      .eq('id', userId)

    if (error) {
      console.error('[admin-handler] Error resetting training:', error.message)
      throw error
    }

    // Reset tasks
    await supabase
      .from('tasks')
      .update({ status: 'locked' })
      .eq('user_id', userId)

    // Set first task to pending
    await supabase
      .from('tasks')
      .update({ status: 'pending' })
      .eq('user_id', userId)
      .eq('task_number', 1)

    console.log('[admin-handler] Training reset successfully')
    return jsonResponse({ 
      success: true,
      message: 'Training reset successfully' 
    }, 200, origin)
  } catch (err: any) {
    console.error('[admin-handler] Reset training error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to reset training' 
    }, 500, origin)
  }
}

async function handleCompleteTask(body: any, origin: string | null) {
  const { userId, taskNumber } = body
  
  try {
    console.log(`[admin-handler] Completing task ${taskNumber} for user ${userId}`)
    
    // Update task status
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('task_number', taskNumber)

    if (taskError) {
      console.error('[admin-handler] Error updating task:', taskError.message)
      throw taskError
    }

    // Get task reward
    const { data: task } = await supabase
      .from('tasks')
      .select('reward')
      .eq('user_id', userId)
      .eq('task_number', taskNumber)
      .single()

    if (!task) throw new Error('Task not found')

    // Update user balance and progress
    const { error: userError } = await supabase
      .from('users')
      .update({
        balance: supabase.sql`balance + ${task.reward}`,
        total_earned: supabase.sql`total_earned + ${task.reward}`,
        tasks_completed: supabase.sql`tasks_completed + 1`
      })
      .eq('id', userId)

    if (userError) {
      console.error('[admin-handler] Error updating user:', userError.message)
      throw userError
    }

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'task_reward',
        amount: task.reward,
        status: 'completed',
        description: `Task ${taskNumber} reward`
      })

    // Set next task to pending
    await supabase
      .from('tasks')
      .update({ status: 'pending' })
      .eq('user_id', userId)
      .eq('task_number', taskNumber + 1)

    console.log('[admin-handler] Task completed successfully')
    return jsonResponse({ 
      success: true,
      message: 'Task completed successfully',
      reward: task.reward
    }, 200, origin)
  } catch (err: any) {
    console.error('[admin-handler] Complete task error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to complete task' 
    }, 500, origin)
  }
}

async function handleGetUserData(body: any, origin: string | null) {
  const { userId } = body
  
  try {
    console.log(`[admin-handler] Getting user data: ${userId}`)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[admin-handler] Error getting user:', error.message)
      throw error
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('task_number')

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    console.log('[admin-handler] User data retrieved successfully')
    return jsonResponse({ 
      success: true,
      user,
      tasks,
      transactions
    }, 200, origin)
  } catch (err: any) {
    console.error('[admin-handler] Get user data error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to get user data' 
    }, 500, origin)
  }
}

// Handle upgrade account action
async function handleUpgradeAccount(body: any, origin: string | null) {
  const { userId } = body
  
  try {
    console.log(`[admin-handler] Upgrading account: ${userId}`)
    
    const { error } = await supabase
      .from('users')
      .update({
        account_type: 'personal',
        training_completed: true,
        training_progress: 100,
        training_phase: 2
      })
      .eq('id', userId)

    if (error) {
      console.error('[admin-handler] Error upgrading account:', error.message)
      throw error
    }

    console.log('[admin-handler] Account upgraded successfully')
    return jsonResponse({ 
      success: true,
      message: 'Account upgraded to personal' 
    }, 200, origin)
  } catch (err: any) {
    console.error('[admin-handler] Upgrade account error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to upgrade account' 
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
  } catch (err: any) {
    console.error('[admin-handler] Get tasks error:', err.message)
    return jsonResponse({ 
      success: false, 
      error: err.message || 'Failed to get tasks' 
    }, 500, origin)
  }
}
