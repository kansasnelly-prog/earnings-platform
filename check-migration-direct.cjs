const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.ybxshqzwirqfybdeukvq:daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkMigrationStatus() {
  console.log('=== Migration Status Check ===\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Check users table constraints
    console.log('1. Current users table constraints:');
    const constraintsQuery = `
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY constraint_name;
    `;
    const constraintsResult = await client.query(constraintsQuery);
    console.log(constraintsResult.rows);
    
    // 2. Check referral_code column details
    console.log('\n2. Referral code column details:');
    const columnQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'referral_code'
      AND table_schema = 'public';
    `;
    const columnResult = await client.query(columnQuery);
    console.log(columnResult.rows);
    
    // 3. Check for check constraints
    console.log('\n3. Check constraints on referral_code:');
    const checkQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'users'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND conname LIKE '%referral%';
    `;
    const checkResult = await client.query(checkQuery);
    console.log(checkResult.rows);
    
    // 4. Check for triggers
    console.log('\n4. Triggers on users table:');
    const triggerQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'users'
      AND trigger_schema = 'public'
      ORDER BY trigger_name;
    `;
    const triggerResult = await client.query(triggerQuery);
    console.log(triggerResult.rows);
    
    // 5. Check for functions
    console.log('\n5. Functions related to referral codes:');
    const functionQuery = `
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%referral%'
      ORDER BY routine_name;
    `;
    const functionResult = await client.query(functionQuery);
    console.log(functionResult.rows);
    
    // 6. Verification query results
    console.log('\n6. Verification query results (referral code statistics):');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN referral_code IS NULL THEN 1 END) as null_referral_codes,
        COUNT(CASE WHEN referral_code LIKE 'OPT-%' THEN 1 END) as opt_format_codes,
        COUNT(CASE WHEN referral_code IS NOT NULL AND referral_code NOT LIKE 'OPT-%' THEN 1 END) as other_format_codes
      FROM users;
    `;
    const statsResult = await client.query(statsQuery);
    console.log(statsResult.rows);
    
    // 7. Show users with NULL referral codes
    console.log('\n7. Users with NULL referral codes:');
    const nullQuery = `
      SELECT id, email, created_at
      FROM users
      WHERE referral_code IS NULL
      ORDER BY created_at DESC;
    `;
    const nullResult = await client.query(nullQuery);
    console.log(nullResult.rows);
    
    // 8. Sample recent users with referral codes
    console.log('\n8. Sample recent users with referral codes:');
    const sampleQuery = `
      SELECT id, email, referral_code, created_at
      FROM users
      WHERE referral_code IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    const sampleResult = await client.query(sampleQuery);
    console.log(sampleResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMigrationStatus();
