// @ts-nocheck
// Deno Edge Function - runs on Supabase Edge Runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://earnings.ink',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

function getCorsHeaders() {
  return corsHeaders;
}

// Helper to create JSON response with CORS
function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// ===== MAIN HANDLER =====
serve(async (req: Request) => {
  const method = req.method
  
  // Handle OPTIONS preflight immediately
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Only allow POST for actions
  if (method !== 'POST') {
    return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405)
  }
  
  try {
    const body = await req.json()
    const { action } = body
    
    switch (action) {
      case 'get_stats':
        return jsonResponse({ success: true, stats: { totalUsers: 1, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0, completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0 } }, 200)
      case 'get_all_users':
        return jsonResponse({ success: true, users: [] }, 200)
      case 'get_all_withdrawals':
        return jsonResponse({ success: true, withdrawals: [] }, 200)
      default:
        return jsonResponse({ success: false, error: `Invalid action: ${action}` }, 400)
    }
  } catch (error: unknown) {
    return jsonResponse({ success: false, error: 'Internal server error' }, 500)
  }
})
