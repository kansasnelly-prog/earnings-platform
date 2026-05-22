import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://db.abcdefg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserState() {
  const email = 'umarjan2244@gmail.com';
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return;
  }
  
  console.log('Current state for', email, ':');
  console.log('=====================================');
  console.log('account_type:', data.account_type);
  console.log('vip_level:', data.vip_level);
  console.log('tasks_completed:', data.tasks_completed);
  console.log('total_tasks:', data.total_tasks);
  console.log('current_task_set:', data.current_task_set);
  console.log('personal_cycle:', data.personal_cycle);
  console.log('personal_cycle_completed:', data.personal_cycle_completed);
  console.log('set_1_completed_at:', data.set_1_completed_at);
  console.log('set_2_completed_at:', data.set_2_completed_at);
  console.log('personal_day2_checkpoint:', data.personal_day2_checkpoint);
  console.log('balance:', data.balance);
  console.log('total_earned:', data.total_earned);
  console.log('training_completed:', data.training_completed);
  console.log('=====================================');
}

checkUserState();
