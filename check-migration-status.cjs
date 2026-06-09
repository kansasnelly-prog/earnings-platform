const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrationStatus() {
  console.log('=== Migration Status Check ===\n');
  
  try {
    // Check 1: Get users table constraints
    console.log('1. Checking users table constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'users' });
    
    if (constraintsError) {
      console.log('   Error getting constraints:', constraintsError.message);
      // Try alternative method
      console.log('   Trying direct query...');
      const { data: directConstraints, error: directError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'users');
      
      if (directError) {
        console.log('   Direct query also failed:', directError.message);
      } else {
        console.log('   Found constraints:', directConstraints);
      }
    } else {
      console.log('   Constraints:', constraints);
    }
    
    // Check 2: Query referral code statistics
    console.log('\n2. Querying referral code statistics...');
    const { data: stats, error: statsError } = await supabase
      .from('users')
      .select('referral_code');
    
    if (statsError) {
      console.log('   Error:', statsError.message);
    } else {
      const totalUsers = stats.length;
      const nullCodes = stats.filter(u => !u.referral_code).length;
      const optFormatCodes = stats.filter(u => u.referral_code && u.referral_code.startsWith('OPT-')).length;
      
      console.log(`   Total users: ${totalUsers}`);
      console.log(`   NULL referral codes: ${nullCodes}`);
      console.log(`   OPT-XXXXXX format codes: ${optFormatCodes}`);
    }
    
    // Check 3: Check for NOT NULL constraint on referral_code
    console.log('\n3. Checking for NOT NULL constraint on referral_code...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable')
      .eq('table_name', 'users')
      .eq('column_name', 'referral_code');
    
    if (columnsError) {
      console.log('   Error:', columnsError.message);
    } else {
      console.log('   Column info:', columns);
    }
    
    // Check 4: Check for check constraint
    console.log('\n4. Checking for referral_code_format_check constraint...');
    const { data: checkConstraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .ilike('constraint_name', '%referral%');
    
    if (checkError) {
      console.log('   Error:', checkError.message);
    } else {
      console.log('   Check constraints:', checkConstraints);
    }
    
    // Check 5: Check for triggers
    console.log('\n5. Checking for referral code triggers...');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .ilike('trigger_name', '%referral%');
    
    if (triggersError) {
      console.log('   Error:', triggersError.message);
    } else {
      console.log('   Triggers:', triggers);
    }
    
    // Check 6: Test if generate_unique_referral_code function exists
    console.log('\n6. Checking for generate_unique_referral_code function...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .ilike('routine_name', '%referral%');
    
    if (functionsError) {
      console.log('   Error:', functionsError.message);
    } else {
      console.log('   Functions:', functions);
    }
    
    // Check 7: Sample recent users to see referral codes
    console.log('\n7. Sampling recent users referral codes...');
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('id, email, referral_code, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.log('   Error:', recentError.message);
    } else {
      console.log('   Recent users:');
      recentUsers.forEach(user => {
        console.log(`     ${user.email}: ${user.referral_code || 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMigrationStatus();
