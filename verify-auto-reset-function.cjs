const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bcKizzSl0LlWoKfGJiAp6w_mCsU4Zwn';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAutoResetFunction() {
  console.log('========================================');
  console.log('VERIFYING auto_reset_to_set_2 FUNCTION');
  console.log('========================================\n');

  // Check if the function exists and get its definition
  console.log('Step 1: Checking if auto_reset_to_set_2 function exists...');
  
  const { data: functionInfo, error: functionError } = await supabase
    .rpc('auto_reset_to_set_2', { p_user_id: '00000000-0000-0000-0000-000000000000' });

  if (functionError) {
    console.error('❌ Function call failed (expected for invalid UUID):', functionError.message);
    
    // Try to get function definition from pg_proc
    const { data: pgProc, error: pgError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'auto_reset_to_set_2')
      .maybeSingle();
    
    if (pgError) {
      console.error('❌ Cannot query pg_proc directly:', pgError);
    } else if (pgProc) {
      console.log('✅ Function exists in pg_proc');
      console.log('   Function source:', pgProc.prosrc?.substring(0, 200) + '...');
    } else {
      console.log('❌ Function NOT found in pg_proc - migration may not have been applied');
    }
  } else {
    console.log('✅ Function exists and is callable');
  }

  console.log('\n----------------------------------------\n');

  // Check the migration status
  console.log('Step 2: Checking migration 2025052201_fix_personal_day2_progression.sql...');
  console.log('   This migration should have updated auto_reset_to_set_2 to set personal_cycle = 2');
  console.log('   ⚠️  Cannot directly check migration status from anon key');
  console.log('   Please verify in Supabase SQL Editor that this migration has been applied');

  console.log('\n----------------------------------------\n');

  // Test with a real user
  console.log('Step 3: Testing auto_reset_to_set_2 with real user...');
  const TEST_EMAIL = 'umarjan2244@gmail.com';
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, current_task_set, personal_cycle, tasks_completed')
    .eq('email', TEST_EMAIL)
    .single();

  if (userError || !user) {
    console.error('❌ User not found:', userError);
    return;
  }

  console.log(`✅ Found user: ${user.email}`);
  console.log(`   Current state: set=${user.current_task_set}, cycle=${user.personal_cycle}, tasks=${user.tasks_completed}`);

  // Reset to Set 1 for testing
  console.log('\n   Resetting to Set 1 for test...');
  await supabase
    .from('users')
    .update({
      current_task_set: 1,
      personal_cycle: 1,
      personal_cycle_completed: false,
      tasks_completed: 35,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  // Call the function
  console.log('\n   Calling auto_reset_to_set_2()...');
  const { data: result, error: resetError } = await supabase.rpc('auto_reset_to_set_2', { 
    p_user_id: user.id 
  });

  if (resetError) {
    console.error('❌ Function call failed:', resetError);
    return;
  }

  console.log('✅ Function executed');
  console.log('   Result:', result);

  // Check the result
  const { data: afterReset, error: fetchError } = await supabase
    .from('users')
    .select('current_task_set, personal_cycle, personal_cycle_completed, tasks_completed')
    .eq('id', user.id)
    .single();

  if (fetchError) {
    console.error('❌ Failed to fetch user after reset:', fetchError);
    return;
  }

  console.log('\n   User state after reset:');
  console.log(`   current_task_set: ${afterReset.current_task_set}`);
  console.log(`   personal_cycle: ${afterReset.personal_cycle}`);
  console.log(`   personal_cycle_completed: ${afterReset.personal_cycle_completed}`);
  console.log(`   tasks_completed: ${afterReset.tasks_completed}`);

  if (afterReset.personal_cycle === 2) {
    console.log('\n✅ SUCCESS: personal_cycle correctly set to 2');
  } else {
    console.log('\n❌ BUG CONFIRMED: personal_cycle is ' + afterReset.personal_cycle + ', expected 2');
    console.log('   The auto_reset_to_set_2 function is NOT setting personal_cycle to 2');
    console.log('   This means migration 2025052201_fix_personal_day2_progression.sql was NOT applied');
  }

  console.log('\n========================================');
  console.log('VERIFICATION COMPLETE');
  console.log('========================================');
}

verifyAutoResetFunction().catch(console.error);
