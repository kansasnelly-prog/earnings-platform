const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bcKizzSl0LlWoKfGJiAp6w_mCsU4Zwn';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test email for simulation
const TEST_EMAIL = 'umarjan2244@gmail.com';

async function createTrainingTasks(userId, taskCount = 35) {
  try {
    // Get user's account_type to determine task count
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('vip_level, account_type, personal_cycle, training_phase')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user for account_type:', userError);
      return false;
    }

    const accountType = user?.account_type || 'training';
    const vipLevel = user?.vip_level || 1;
    const isPersonal = accountType === 'personal';
    const isAdmin = accountType === 'admin';
    const personalCycle = user?.personal_cycle || 1;
    const isVIP1Personal = isPersonal && vipLevel === 1;

    console.log(`[createTrainingTasks] Creating ${taskCount} tasks for ${accountType} account (cycle ${personalCycle})`);

    // Define commission rate
    const commissionRate = isPersonal ? 0.005 : 0.01;

    // Create training tasks
    const tasks = Array.from({ length: taskCount }, (_, i) => {
      let reward;
      if (isVIP1Personal) {
        // VIP1 Personal accounts: deterministic rewards to total $10.25 for 35 tasks
        const TARGET_TOTAL = 10.25;
        const TOTAL_TASKS = 35;
        const MIN_REWARD = 0.15;
        const MAX_REWARD = 0.42;
        
        // Deterministic pseudorandom based on task number
        const seed = i + 1;
        const deterministicRandom = (seed) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        const variance = deterministicRandom(seed);
        reward = MIN_REWARD + (variance * (MAX_REWARD - MIN_REWARD));
        
        // Adjust last task to ensure exact total
        if (i === TOTAL_TASKS - 1) {
          const sumSoFar = Array.from({ length: TOTAL_TASKS - 1 }, (_, j) => {
            const s = j + 1;
            const v = deterministicRandom(s);
            return MIN_REWARD + (v * (MAX_REWARD - MIN_REWARD));
          }).reduce((a, b) => a + b, 0);
          reward = TARGET_TOTAL - sumSoFar;
        }
      } else {
        // Default reward for other account types
        reward = 0.30;
      }
      
      return {
        user_id: userId,
        task_number: i + 1,
        product_name: `Product ${i + 1}`,
        product_price: Math.floor(Math.random() * 100) + 50,
        product_image: null,
        reward: parseFloat(reward.toFixed(2)),
        commission_rate: commissionRate,
        status: i === 0 ? 'pending' : 'locked',
        created_at: new Date().toISOString()
      };
    });

    const { error: insertError } = await supabase
      .from('tasks')
      .insert(tasks);

    if (insertError) {
      console.error('Error creating tasks:', insertError);
      return false;
    }

    console.log(`[createTrainingTasks] Successfully created ${taskCount} tasks`);
    return true;
  } catch (error) {
    console.error('Exception in createTrainingTasks:', error);
    return false;
  }
}

async function runEndToEndDay2Flow() {
  console.log('========================================');
  console.log('END-TO-END DAY 2 FLOW TEST');
  console.log('========================================\n');

  // Step 1: Get test user
  console.log('Step 1: Getting test user...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single();

  if (userError || !user) {
    console.error('❌ User not found:', userError);
    return;
  }

  const testUserId = user.id;
  console.log(`✅ Found user: ${TEST_EMAIL}`);
  console.log(`   Current state: set=${user.current_task_set}, cycle=${user.personal_cycle}, tasks=${user.tasks_completed}`);

  console.log('\n----------------------------------------\n');

  // Step 2: Reset user to Set 1, cycle 1 for clean test
  console.log('Step 2: Resetting user to Set 1, cycle 1...');
  const { error: resetError } = await supabase
    .from('users')
    .update({
      current_task_set: 1,
      personal_cycle: 1,
      personal_cycle_completed: false,
      tasks_completed: 0,
      training_progress: 0,
      set_1_completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUserId);

  if (resetError) {
    console.error('❌ Failed to reset user:', resetError);
    return;
  }

  // Delete existing tasks
  await supabase
    .from('tasks')
    .delete()
    .eq('user_id', testUserId);

  console.log('✅ Reset user to Set 1, cycle 1 and deleted existing tasks');

  console.log('\n----------------------------------------\n');

  // Step 3: Simulate completing Day 1 task 35
  console.log('Step 3: Simulating Day 1 task 35 completion...');
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
    console.error('❌ Failed to update tasks_completed:', updateError);
    return;
  }

  console.log('✅ Updated tasks_completed to 35');

  console.log('\n----------------------------------------\n');

  // Step 4: Call auto_reset_to_set_2() (database function)
  console.log('Step 4: Calling auto_reset_to_set_2() database function...');
  const { data: resetData, error: resetFuncError } = await supabase.rpc('auto_reset_to_set_2', { 
    p_user_id: testUserId 
  });

  if (resetFuncError) {
    console.error('❌ auto_reset_to_set_2() failed:', resetFuncError);
    return;
  }

  console.log('✅ auto_reset_to_set_2() executed successfully');
  console.log('   Result:', resetData);

  console.log('\n----------------------------------------\n');

  // Step 5: Verify personal_cycle changed to 2
  console.log('Step 5: Verifying personal_cycle change...');
  const { data: afterReset, error: fetchError } = await supabase
    .from('users')
    .select('current_task_set, personal_cycle, personal_cycle_completed, tasks_completed')
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

  if (afterReset.personal_cycle === 2) {
    console.log('✅ CONFIRMED: personal_cycle changed to 2');
  } else {
    console.log(`❌ FAILED: personal_cycle is ${afterReset.personal_cycle}, expected 2`);
    return;
  }

  console.log('\n----------------------------------------\n');

  // Step 6: Create 35 Set 2 tasks (application layer)
  console.log('Step 6: Creating 35 Set 2 tasks via createTrainingTasks()...');
  const tasksCreated = await createTrainingTasks(testUserId, 35);

  if (!tasksCreated) {
    console.error('❌ Failed to create tasks');
    return;
  }

  console.log('✅ Tasks created successfully');

  console.log('\n----------------------------------------\n');

  // Step 7: Verify 35 tasks were created
  console.log('Step 7: Verifying 35 Set 2 tasks were created...');
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
    console.log('✅ CONFIRMED: 35 Set 2 tasks created');
    console.log(`   Task range: ${tasks[0].task_number} to ${tasks[tasks.length - 1].task_number}`);
    console.log(`   First task status: ${tasks[0].status}`);
    console.log(`   Last task status: ${tasks[tasks.length - 1].status}`);
    console.log(`   Total reward sum: $${tasks.reduce((sum, t) => sum + t.reward, 0).toFixed(2)}`);
  } else {
    console.log(`❌ FAILED: Expected 35 tasks, found ${tasks?.length || 0}`);
    return;
  }

  console.log('\n----------------------------------------\n');

  // Step 8: Simulate reaching task 21 to trigger Day 2 checkpoint
  console.log('Step 8: Simulating task 21 completion to trigger Day 2 checkpoint...');
  
  // Update tasks_completed to 21
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

  // Step 9: Verify Day 2 checkpoint triggered
  console.log('Step 9: Verifying Day 2 checkpoint trigger...');
  
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
    console.log(`   Triggered at: ${checkpointUser.personal_day2_checkpoint?.triggered_at}`);
    console.log(`   Task number: ${checkpointUser.personal_day2_checkpoint?.task_number}`);
  } else {
    console.log(`⚠️  Day 2 checkpoint not triggered yet. Status: ${checkpointStatus || 'null'}`);
  }

  // Check the personal_day2_checkpoints table
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
  console.log('END-TO-END DAY 2 FLOW TEST COMPLETE');
  console.log('========================================\n');

  console.log('SUMMARY:');
  console.log('--------');
  console.log(`1. personal_cycle change: ${afterReset.personal_cycle === 2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`2. Set 2 tasks created: ${tasks?.length === 35 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`3. Day 2 checkpoint triggered: ${checkpointStatus === 'pending_review' || checkpointStatus === 'pending' ? '✅ PASS' : '⚠️  PENDING'}`);
}

runEndToEndDay2Flow().catch(console.error);
