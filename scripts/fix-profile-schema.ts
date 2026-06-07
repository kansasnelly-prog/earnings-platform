import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfileSchema() {
  console.log('🚀 Executing schema migration: Adding profile_type column to matchmaking_profiles table...');
  
  try {
    // Execute the ALTER TABLE command via Supabase SQL API
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.matchmaking_profiles ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT \'standard\';'
    });

    if (error) {
      console.error('❌ Schema migration failed:', error);
      throw error;
    }

    console.log('✅ Schema migration successful: profile_type column added to matchmaking_profiles table');
    console.log('📊 Default value set to: standard');
    console.log('🔒 Existing profiles remain untouched');
    
    return { success: true };
  } catch (error) {
    console.error('💥 Critical error during schema migration:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution if RPC is not available
async function fixProfileSchemaDirect() {
  console.log('🚀 Executing schema migration via direct SQL execution...');
  
  try {
    // Use Supabase's SQL editor API or direct PostgreSQL connection
    // This is a fallback approach
    const { error } = await supabase
      .from('matchmaking_profiles')
      .select('profile_type')
      .limit(1);

    if (error && error.code === '42703') {
      // Column does not exist, need to add it
      console.log('📝 Column profile_type does not exist. Adding it now...');
      
      // Since we can't execute ALTER TABLE directly via the JS client,
      // we'll create a migration file for manual execution
      const migrationSQL = `
-- Migration: Add profile_type column to matchmaking_profiles
-- Execute this in Supabase SQL Editor
ALTER TABLE public.matchmaking_profiles ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'standard';
`;
      
      console.log('⚠️  Please execute the following SQL in Supabase SQL Editor:');
      console.log(migrationSQL);
      
      return { success: false, requiresManual: true };
    }

    console.log('✅ Column profile_type already exists or table is accessible');
    return { success: true };
  } catch (error) {
    console.error('💥 Error checking schema:', error);
    return { success: false, requiresManual: true };
  }
}

// Execute the migration
fixProfileSchema().catch(() => {
  console.log('⚠️  RPC method failed, trying direct approach...');
  fixProfileSchemaDirect();
});
