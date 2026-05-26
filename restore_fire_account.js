// Restore Fire@gmail.com to Day 2 state
import { createClient } from '@supabase/supabase-js';

// Use production credentials
const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
// You need to provide the service role key - get it from Supabase dashboard
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (supabaseKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Get it from: https://supabase.com/dashboard/project/ybxshqzwirqfybdeukvq/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAccount() {
  try {
    console.log('Checking if Fire@gmail.com exists...');
    
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email, id, balance, total_earned, personal_cycle')
      .ilike('email', 'Fire@gmail.com')
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking account:', checkError);
      process.exit(1);
    }
    
    if (!existingUser) {
      console.error('Account Fire@gmail.com not found in database');
      console.log('Searching for similar emails...');
      const { data: similarUsers } = await supabase
        .from('users')
        .select('email')
        .ilike('email', '%fire%');
      console.log('Similar emails:', similarUsers);
      process.exit(1);
    }
    
    console.log('Found account:', existingUser.email, 'ID:', existingUser.id);
    console.log('Current state:', {
      balance: existingUser.balance,
      total_earned: existingUser.total_earned,
      personal_cycle: existingUser.personal_cycle
    });
    
    console.log('Restoring Fire@gmail.com to Day 2 state...');
    
    const { data, error } = await supabase
      .from('users')
      .update({
        balance: 71.63,
        total_earned: 20.50,
        personal_cycle: 2,
        personal_cycle_completed: false,
        tasks_completed: 0,
        training_progress: 0,
        current_task_set: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id)
      .select();
    
    if (error) {
      console.error('Error updating account:', error);
      process.exit(1);
    }
    
    console.log('Account restored successfully:', data);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('email, balance, total_earned, personal_cycle, personal_cycle_completed, tasks_completed, training_progress, current_task_set')
      .eq('id', existingUser.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying account:', verifyError);
      process.exit(1);
    }
    
    console.log('Verified account state:', verifyData);
    console.log('✅ Account restoration complete');
    console.log('✅ Day 2 checkpoint status:', verifyData.personal_cycle === 2 ? 'Cycle 2' : 'Not Cycle 2');
    console.log('✅ Balance:', verifyData.balance);
    console.log('✅ Total earned:', verifyData.total_earned);
  } catch (error) {
    console.error('Exception:', error);
    process.exit(1);
  }
}

restoreAccount();
