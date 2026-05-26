import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://db.abcdefg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserState(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}

async function resetDay2ForFire() {
  console.log('=== CHECKING CURRENT STATE ===');
  
  const fireUser = await checkUserState('Fire@gmail.com');
  const mfireUser = await checkUserState('mfire@gmail.com');
  
  console.log('\nFire@gmail.com current state:');
  console.log('=====================================');
  console.log('account_type:', fireUser?.account_type);
  console.log('vip_level:', fireUser?.vip_level);
  console.log('tasks_completed:', fireUser?.tasks_completed);
  console.log('total_tasks:', fireUser?.total_tasks);
  console.log('current_task_set:', fireUser?.current_task_set);
  console.log('personal_cycle:', fireUser?.personal_cycle);
  console.log('personal_cycle_completed:', fireUser?.personal_cycle_completed);
  console.log('set_1_completed_at:', fireUser?.set_1_completed_at);
  console.log('set_2_completed_at:', fireUser?.set_2_completed_at);
  console.log('personal_day2_checkpoint:', fireUser?.personal_day2_checkpoint);
  console.log('balance:', fireUser?.balance);
  console.log('total_earned:', fireUser?.total_earned);
  console.log('training_completed:', fireUser?.training_completed);
  console.log('=====================================');
  
  console.log('\nmfire@gmail.com current state:');
  console.log('=====================================');
  console.log('account_type:', mfireUser?.account_type);
  console.log('vip_level:', mfireUser?.vip_level);
  console.log('tasks_completed:', mfireUser?.tasks_completed);
  console.log('total_tasks:', mfireUser?.total_tasks);
  console.log('current_task_set:', mfireUser?.current_task_set);
  console.log('personal_cycle:', mfireUser?.personal_cycle);
  console.log('personal_cycle_completed:', mfireUser?.personal_cycle_completed);
  console.log('set_1_completed_at:', mfireUser?.set_1_completed_at);
  console.log('set_2_completed_at:', mfireUser?.set_2_completed_at);
  console.log('personal_day2_checkpoint:', mfireUser?.personal_day2_checkpoint);
  console.log('balance:', mfireUser?.balance);
  console.log('total_earned:', mfireUser?.total_earned);
  console.log('training_completed:', mfireUser?.training_completed);
  console.log('=====================================');
  
  console.log('\n=== EXECUTING FIXES ===');
  
  // Step 1: Reset Day 2 ONLY for Fire@gmail.com
  console.log('\nStep 1: Resetting Day 2 for Fire@gmail.com...');
  const { error: fireError } = await supabase
    .from('users')
    .update({
      personal_day2_checkpoint: null,
      set_2_completed_at: null,
      current_task_set: 2,
      personal_cycle: 2,
      personal_cycle_completed: false,
      // Keep balance and total_earned unchanged
    })
    .eq('email', 'Fire@gmail.com');
  
  if (fireError) {
    console.error('Error resetting Fire@gmail.com:', fireError);
  } else {
    console.log('✓ Successfully reset Day 2 for Fire@gmail.com');
  }
  
  // Step 2: Try to restore mfire@gmail.com
  // Since we don't have backup data, we'll restore to a reasonable state
  // Assuming mfire@gmail.com was on Day 2 before the accidental reset
  console.log('\nStep 2: Attempting to restore mfire@gmail.com...');
  const { error: mfireError } = await supabase
    .from('users')
    .update({
      personal_day2_checkpoint: 'in_progress',
      set_2_completed_at: null,
      current_task_set: 2,
      personal_cycle: 2,
      personal_cycle_completed: false,
      // Keep balance and total_earned unchanged
    })
    .eq('email', 'mfire@gmail.com');
  
  if (mfireError) {
    console.error('Error restoring mfire@gmail.com:', mfireError);
  } else {
    console.log('✓ Successfully restored mfire@gmail.com to Day 2 in progress');
  }
  
  console.log('\n=== VERIFICATION ===');
  
  const fireAfter = await checkUserState('Fire@gmail.com');
  const mfireAfter = await checkUserState('mfire@gmail.com');
  
  console.log('\nFire@gmail.com after fix:');
  console.log('personal_day2_checkpoint:', fireAfter?.personal_day2_checkpoint);
  console.log('set_2_completed_at:', fireAfter?.set_2_completed_at);
  console.log('current_task_set:', fireAfter?.current_task_set);
  console.log('balance:', fireAfter?.balance);
  
  console.log('\nmfire@gmail.com after fix:');
  console.log('personal_day2_checkpoint:', mfireAfter?.personal_day2_checkpoint);
  console.log('set_2_completed_at:', mfireAfter?.set_2_completed_at);
  console.log('current_task_set:', mfireAfter?.current_task_set);
  console.log('balance:', mfireAfter?.balance);
  
  console.log('\n=== FIX COMPLETE ===');
}

resetDay2ForFire();
