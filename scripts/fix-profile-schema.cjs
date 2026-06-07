const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSchemaFix() {
  console.log('🚀 PROTOCOL 15: SCHEMA PURIFICATION OVERRIDE');
  console.log('========================================');
  console.log('Target: Add profile_type column to matchmaking_profiles table');
  console.log('========================================\n');

  const migrationSQL = `
-- Migration: Add profile_type column to matchmaking_profiles table
-- Protocol 15 - Schema Purification Override
-- Purpose: Resolve infinite loading loop by adding missing profile_type column

ALTER TABLE public.matchmaking_profiles 
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'standard';

-- Add comment for documentation
COMMENT ON COLUMN public.matchmaking_profiles.profile_type IS 'Profile type: standard, single, traveler, or premium';
`;

  console.log('📝 Executing SQL migration...');
  console.log('----------------------------------------');
  console.log(migrationSQL);
  console.log('----------------------------------------\n');

  try {
    // Try using the exec_sql RPC function first
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('⚠️  RPC method failed:', error.message);
      console.log('🔄 Trying alternative approach via direct SQL execution...\n');
      
      // Alternative: Use the Supabase SQL Editor API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ Migration applied successfully via REST API');
      console.log('Result:', result);
      return;
    }

    console.log('✅ Migration applied successfully via RPC');
    console.log('Result:', data);
  } catch (error) {
    console.error('❌ Migration execution failed:', error.message);
    console.log('\n⚠️  AUTOMATIC FALLBACK: Manual execution required');
    console.log('Please execute the following SQL in Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Create new query');
    console.log('4. Paste and run:');
    console.log(migrationSQL);
    console.log('----------------------------------------');
    process.exit(1);
  }
}

executeSchemaFix()
  .then(() => {
    console.log('\n🎉 SCHEMA PURIFICATION COMPLETE');
    console.log('✅ profile_type column added to matchmaking_profiles table');
    console.log('✅ Default value: standard');
    console.log('✅ Existing profiles preserved');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Critical error:', error);
    process.exit(1);
  });
