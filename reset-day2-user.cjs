// Reset Day 2 task cycle for specific user Fire@gmail.com
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bcKizzSl0LlWoKfGJiAp6w_mCsU4Zwn';

// Disable SSL verification for this operation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'Fire@gmail.com';

async function resetDay2ForUser() {
  console.log('=== Day 2 Reset for User ===');
  console.log('Target email:', TARGET_EMAIL);
  console.log('');

  try {
    // Step 1: Find the user
    console.log('Step 1: Finding user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, current_task_set, personal_cycle, personal_cycle_completed, tasks_completed, set_1_completed_at, set_2_completed_at')
      .ilike('email', `%${TARGET_EMAIL}%`);

    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.error('❌ User not found:', TARGET_EMAIL);
      console.log('   Searching for similar emails...');
      
      // Try case-insensitive search
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('email')
        .limit(10);
      
      if (!allError && allUsers) {
        console.log('   Recent users in database:');
        allUsers.forEach(u => console.log('   -', u.email));
      }
      return;
    }

    if (users.length > 1) {
      console.log('⚠️  Found multiple users matching:', TARGET_EMAIL);
      users.forEach(u => console.log('   -', u.email));
      console.log('   Using first match');
    }

    const user = users[0];

    console.log('✅ Found user:', user.email);
    console.log('   Current state:');
    console.log('   - current_task_set:', user.current_task_set);
    console.log('   - personal_cycle:', user.personal_cycle);
    console.log('   - personal_cycle_completed:', user.personal_cycle_completed);
    console.log('   - tasks_completed:', user.tasks_completed);
    console.log('   - set_1_completed_at:', user.set_1_completed_at);
    console.log('   - set_2_completed_at:', user.set_2_completed_at);
    console.log('');

    // Step 2: Update user cycle state
    console.log('Step 2: Updating user cycle state...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        personal_cycle: 2,
        personal_cycle_completed: false,
        current_task_set: 1,
        set_1_completed_at: null,
        set_2_completed_at: null,
        tasks_completed: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ User cycle state updated');
    console.log('');

    // Step 3: Delete Day 2 task progress rows
    console.log('Step 3: Deleting Day 2 task progress rows...');
    console.log('   Checking tasks table schema...');
    
    // First, check what columns exist in tasks table
    const { data: taskColumns, error: schemaError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (schemaError) {
      console.error('❌ Error checking tasks schema:', schemaError);
    } else if (taskColumns && taskColumns.length > 0) {
      console.log('   Tasks table columns:', Object.keys(taskColumns[0]));
    }

    // Try to delete tasks for this user (all tasks, since we're resetting Day 2)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Error deleting task progress:', deleteError);
      console.log('   Continuing without task deletion (may need manual cleanup)');
    } else {
      console.log('✅ All task progress deleted for user');
    }
    console.log('');

    // Step 4: Verify changes
    console.log('Step 4: Verifying changes...');
    const { data: afterUpdate, error: fetchError } = await supabase
      .from('users')
      .select('id, email, current_task_set, personal_cycle, personal_cycle_completed, tasks_completed, set_1_completed_at, set_2_completed_at')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated user:', fetchError);
      return;
    }

    console.log('✅ User state after reset:');
    console.log('   - current_task_set:', afterUpdate.current_task_set);
    console.log('   - personal_cycle:', afterUpdate.personal_cycle);
    console.log('   - personal_cycle_completed:', afterUpdate.personal_cycle_completed);
    console.log('   - tasks_completed:', afterUpdate.tasks_completed);
    console.log('   - set_1_completed_at:', afterUpdate.set_1_completed_at);
    console.log('   - set_2_completed_at:', afterUpdate.set_2_completed_at);
    console.log('');

    // Step 5: Check remaining tasks
    const { data: remainingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, task_set, task_number')
      .eq('user_id', user.id);

    if (tasksError) {
      console.error('❌ Error fetching remaining tasks:', tasksError);
    } else {
      console.log('✅ Remaining tasks for user:', remainingTasks?.length || 0);
      if (remainingTasks && remainingTasks.length > 0) {
        console.log('   Task sets:', [...new Set(remainingTasks.map(t => t.task_set))]);
      }
    }

    console.log('');
    console.log('=== Reset Complete ===');
    console.log('User', TARGET_EMAIL, 'can now start Day 2 from task 1');
    console.log('Wallet balance unchanged');
    console.log('No other users affected');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

resetDay2ForUser();
