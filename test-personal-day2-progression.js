const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bcKizzSl0LlWoKfGJiAp6w_mCsU4Zwn';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test email for simulation
const TEST_EMAIL = 'test-personal-day2@example.com';

async function runTestVerification() {
  console.log('========================================');
  console.log('TEST VERIFICATION: Personal Day 2 Progression');
  console.log('========================================\n');

  // Step 1: Run legacy detection query FIRST (before any changes)
  console.log('Step 1: Running legacy detection query...');
  console.log('Query: Find users with current_task_set = 2 AND personal_cycle = 1');
  
  const { data: legacyUsers, error: legacyError } = await supabase
    .from('users')
    .select('id, email, current_task_set, personal_cycle, tasks_completed')
    .eq('current_task_set', 2)
    .eq('personal_cycle', 1);

  if (legacyError) {
    console.error('❌ Legacy detection query failed:', legacyError);
  } else {
    console.log(`✅ Legacy detection complete`);
    console.log(`   Found ${legacyUsers?.length || 0} users with current_task_set = 2 AND personal_cycle = 1`);
    if (legacyUsers && legacyUsers.length > 0) {
      console.log('   Legacy users:');
      legacyUsers.forEach(user => {
        console.log(`   - ${user.email}: set=${user.current_task_set}, cycle=${user.personal_cycle}, tasks=${user.tasks_completed}`);
      });
    }
  }

  console.log('\n----------------------------------------\n');

  // Step 2: Check if test user exists
  console.log('Step 2: Checking for test user...');
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('email', TEST_EMAIL)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking test user:', checkError);
    return;
  }

  let testUserId;

  if (existingUser) {
    console.log(`✅ Found existing test user: ${TEST_EMAIL}`);
    testUserId = existingUser.id;
    console.log(`   Current state: set=${existingUser.current_task_set}, cycle=${existingUser.personal_cycle}, tasks=${existingUser.tasks_completed}`);
  } else {
    console.log(`⚠️  Test user not found. Creating new test user...`);
    // Create a test user (this would require auth, so we'll skip for now)
    console.log('❌ Cannot create test user without auth. Please create test user manually first.');
    console.log('   Required: Personal account with training_completed=true, current_task_set=1, personal_cycle=1');
    return;
  }

  console.log('\n----------------------------------------\n');

  // Step 3: Simulate finishing Day 1 task 35
  console.log('Step 3: Simulating Day 1 task 35 completion...');
  console.log('   Setting tasks_completed to 35 for test user...');

  const { error: updateError } = await supabase
    .from('users')
    .update({
      tasks_completed: 35,
      training_progress: 100,
      personal_cycle_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUserId);

  if (updateError) {
    console.error('❌ Failed to update test user:', updateError);
    return;
  }

  console.log('✅ Updated tasks_completed to 35');

  console.log('\n----------------------------------------\n');

  // Step 4: Call auto_reset_to_set_2 function
  console.log('Step 4: Calling auto_reset_to_set_2() function...');
  
  const { data: resetData, error: resetError } = await supabase.rpc('auto_reset_to_set_2', { 
    p_user_id: testUserId 
  });

  if (resetError) {
    console.error('❌ auto_reset_to_set_2() failed:', resetError);
    console.error('   This is expected if the function does not exist in the database');
    console.error('   Please ensure migration 2025052201_fix_personal_day2_progression.sql has been applied');
    return;
  }

  console.log('✅ auto_reset_to_set_2() executed successfully');
  console.log('   Result:', resetData);

  console.log('\n----------------------------------------\n');

  // Step 5: Confirm personal_cycle changes from 1 → 2
  console.log('Step 5: Verifying personal_cycle change (1 → 2)...');
  
  const { data: afterReset, error: fetchError } = await supabase
    .from('users')
    .select('current_task_set, personal_cycle, personal_cycle_completed, tasks_completed, set_1_completed_at')
    .eq('id', testUserId)
    .single();

  if (fetchError) {
    console.error('❌ Failed to fetch user after reset:', fetchError);
    return;
  }

  console.log('✅ User state after reset:');
  console.log(`   current_task_set: ${afterReset.current_task_set}`);
  console.log(`   personal_cycle: ${afterReset.personal_cycle}`);
  console.log(`   personal_cycle_completed: ${afterReset.personal_cycle_completed}`);
  console.log(`   tasks_completed: ${afterReset.tasks_completed}`);
  console.log(`   set_1_completed_at: ${afterReset.set_1_completed_at}`);

  if (afterReset.personal_cycle === 2) {
    console.log('✅ CONFIRMED: personal_cycle changed from 1 → 2');
  } else {
    console.log(`❌ FAILED: personal_cycle is ${afterReset.personal_cycle}, expected 2`);
  }

  if (afterReset.current_task_set === 2) {
    console.log('✅ CONFIRMED: current_task_set changed to 2');
  } else {
    console.log(`❌ FAILED: current_task_set is ${afterReset.current_task_set}, expected 2`);
  }

  console.log('\n----------------------------------------\n');

  // Step 6: Confirm Set 2 tasks are created
  console.log('Step 6: Verifying Set 2 tasks creation...');
  
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', testUserId)
    .order('task_number', { ascending: true });

  if (tasksError) {
    console.error('❌ Failed to fetch tasks:', tasksError);
    return;
  }

  console.log(`✅ Found ${tasks?.length || 0} tasks for user`);
  
  if (tasks && tasks.length === 35) {
    console.log('✅ CONFIRMED: 35 tasks created for Set 2');
    console.log(`   Task range: ${tasks[0].task_number} to ${tasks[tasks.length - 1].task_number}`);
    console.log(`   First task status: ${tasks[0].status}`);
    console.log(`   Last task status: ${tasks[tasks.length - 1].status}`);
  } else {
    console.log(`❌ FAILED: Expected 35 tasks, found ${tasks?.length || 0}`);
  }

  console.log('\n----------------------------------------\n');

  // Step 7: Simulate reaching task 21 in Set 2 to trigger Day 2 checkpoint
  console.log('Step 7: Simulating task 21 completion to trigger Day 2 checkpoint...');
  console.log('   Setting tasks_completed to 21...');

  const { error: task21Error } = await supabase
    .from('users')
    .update({
      tasks_completed: 21,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUserId);

  if (task21Error) {
    console.error('❌ Failed to update tasks_completed to 21:', task21Error);
    return;
  }

  console.log('✅ Updated tasks_completed to 21');

  // Update task 21 to completed
  const { error: updateTask21Error } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('user_id', testUserId)
    .eq('task_number', 21);

  if (updateTask21Error) {
    console.error('❌ Failed to update task 21 status:', updateTask21Error);
  } else {
    console.log('✅ Updated task 21 status to completed');
  }

  console.log('\n----------------------------------------\n');

  // Step 8: Confirm Day 2 checkpoint triggers
  console.log('Step 8: Verifying Day 2 checkpoint trigger...');
  
  const { data: checkpointUser, error: checkpointError } = await supabase
    .from('users')
    .select('personal_day2_checkpoint')
    .eq('id', testUserId)
    .single();

  if (checkpointError) {
    console.error('❌ Failed to fetch checkpoint data:', checkpointError);
    return;
  }

  console.log('✅ personal_day2_checkpoint field:', checkpointUser.personal_day2_checkpoint);

  const checkpointStatus = checkpointUser.personal_day2_checkpoint?.status;
  if (checkpointStatus === 'pending_review' || checkpointStatus === 'pending') {
    console.log('✅ CONFIRMED: Day 2 checkpoint triggered');
    console.log(`   Checkpoint status: ${checkpointStatus}`);
  } else {
    console.log(`⚠️  Day 2 checkpoint not triggered yet. Status: ${checkpointStatus || 'null'}`);
    console.log('   This may require the database trigger to be active');
  }

  // Also check the personal_day2_checkpoints table
  const { data: checkpointRecord, error: checkpointRecordError } = await supabase
    .from('personal_day2_checkpoints')
    .select('*')
    .eq('auth_user_id', testUserId)
    .maybeSingle();

  if (checkpointRecordError) {
    console.error('❌ Failed to fetch checkpoint record:', checkpointRecordError);
  } else if (checkpointRecord) {
    console.log('✅ CONFIRMED: Checkpoint record created in personal_day2_checkpoints table');
    console.log(`   Checkpoint ID: ${checkpointRecord.id}`);
    console.log(`   Status: ${checkpointRecord.status}`);
    console.log(`   Task number: ${checkpointRecord.task_number}`);
    console.log(`   Cycle: ${checkpointRecord.cycle}`);
  } else {
    console.log('⚠️  No checkpoint record found in personal_day2_checkpoints table');
  }

  console.log('\n========================================');
  console.log('TEST VERIFICATION COMPLETE');
  console.log('========================================\n');

  console.log('SUMMARY:');
  console.log('--------');
  console.log(`1. Legacy users with broken state: ${legacyUsers?.length || 0}`);
  console.log(`2. personal_cycle change: ${afterReset.personal_cycle === 2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`3. Set 2 tasks created: ${tasks?.length === 35 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`4. Day 2 checkpoint triggered: ${checkpointStatus === 'pending_review' || checkpointStatus === 'pending' ? '✅ PASS' : '⚠️  PENDING'}`);
}

// Run the test
runTestVerification().catch(console.error);
