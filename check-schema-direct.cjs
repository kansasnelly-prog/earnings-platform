const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchemaDirectly() {
  console.log('=== Direct Schema Check ===\n');
  
  try {
    // Use raw SQL queries to check schema
    const queries = [
      {
        name: 'Check users table structure',
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'referral_code'
        `
      },
      {
        name: 'Check constraints on users table',
        sql: `
          SELECT 
            constraint_name,
            constraint_type
          FROM information_schema.table_constraints 
          WHERE table_name = 'users'
        `
      },
      {
        name: 'Check check constraints',
        sql: `
          SELECT 
            constraint_name,
            check_clause
          FROM information_schema.check_constraints 
          WHERE constraint_name LIKE '%referral%'
        `
      },
      {
        name: 'Check for referral code function',
        sql: `
          SELECT 
            routine_name,
            routine_type
          FROM information_schema.routines 
          WHERE routine_name LIKE '%referral%'
        `
      },
      {
        name: 'Check for referral code triggers',
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table
          FROM information_schema.triggers 
          WHERE trigger_name LIKE '%referral%'
        `
      }
    ];
    
    for (const query of queries) {
      console.log(`\n${query.name}:`);
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query.sql });
        if (error) {
          console.log(`  Error: ${error.message}`);
          // Try using pg_catalog instead
          console.log(`  Trying alternative approach...`);
        } else {
          console.log(`  Result:`, data);
        }
      } catch (e) {
        console.log(`  Exception: ${e.message}`);
      }
    }
    
    // Check referral code statistics
    console.log('\n\n=== Referral Code Statistics ===');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('referral_code');
    
    if (!usersError && users) {
      const total = users.length;
      const nullCount = users.filter(u => !u.referral_code).length;
      const optCount = users.filter(u => u.referral_code && u.referral_code.startsWith('OPT-')).length;
      const otherCount = total - nullCount - optCount;
      
      console.log(`Total users: ${total}`);
      console.log(`NULL referral codes: ${nullCount}`);
      console.log(`OPT-XXXXXX format: ${optCount}`);
      console.log(`Other formats: ${otherCount}`);
      
      if (nullCount > 0) {
        console.log(`\nUsers with NULL referral codes:`);
        const { data: nullUsers } = await supabase
          .from('users')
          .select('id, email, created_at')
          .is('referral_code', null);
        console.log(nullUsers);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchemaDirectly();
