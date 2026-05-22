const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bcKizzSl0LlWoKfGJiAp6w_mCsU4Zwn';

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairLegacyUsers() {
  console.log('========================================');
  console.log('REPAIRING LEGACY USERS');
  console.log('========================================\n');

  // Step 1: Find all users with broken state
  console.log('Step 1: Finding users with broken state (current_task_set = 2 AND personal_cycle = 1)...');
  
  const { data: legacyUsers, error: legacyError } = await supabase
    .from('users')
    .select('id, email, current_task_set, personal_cycle, tasks_completed')
    .eq('current_task_set', 2)
    .eq('personal_cycle', 1);

  if (legacyError) {
    console.error('❌ Failed to find legacy users:', legacyError);
    return;
  }

  console.log(`✅ Found ${legacyUsers?.length || 0} users with broken state`);
  if (legacyUsers && legacyUsers.length > 0) {
    console.log('   Legacy users:');
    legacyUsers.forEach(user => {
      console.log(`   - ${user.email}: set=${user.current_task_set}, cycle=${user.personal_cycle}, tasks=${user.tasks_completed}`);
    });
  }

  console.log('\n----------------------------------------\n');

  // Step 2: Repair each legacy user
  if (!legacyUsers || legacyUsers.length === 0) {
    console.log('No legacy users to repair.');
    return;
  }

  console.log('Step 2: Repairing each legacy user...');
  
  for (const user of legacyUsers) {
    console.log(`\n   Repairing user: ${user.email} (${user.id})`);
    
    const { data: result, error: repairError } = await supabase.rpc('repair_personal_day2_state', { 
      p_user_id: user.id 
    });

    if (repairError) {
      console.error(`   ❌ Repair failed for ${user.email}:`, repairError);
    } else {
      console.log(`   ✅ Repair successful for ${user.email}:`, result);
    }
  }

  console.log('\n----------------------------------------\n');

  // Step 3: Verify repairs
  console.log('Step 3: Verifying repairs...');
  
  const { data: afterRepair, error: verifyError } = await supabase
    .from('users')
    .select('id, email, current_task_set, personal_cycle, tasks_completed')
    .eq('current_task_set', 2)
    .eq('personal_cycle', 1);

  if (verifyError) {
    console.error('❌ Failed to verify repairs:', verifyError);
  } else {
    const remainingBrokenUsers = afterRepair?.length || 0;
    console.log(`✅ Verification complete`);
    console.log(`   Users still in broken state: ${remainingBrokenUsers}`);
    
    if (remainingBrokenUsers === 0) {
      console.log('   ✅ All legacy users successfully repaired!');
    } else {
      console.log('   ⚠️  Some users still in broken state:');
      afterRepair.forEach(user => {
        console.log(`   - ${user.email}: set=${user.current_task_set}, cycle=${user.personal_cycle}`);
      });
    }
  }

  console.log('\n========================================');
  console.log('LEGACY USER REPAIR COMPLETE');
  console.log('========================================');
}

repairLegacyUsers().catch(console.error);
