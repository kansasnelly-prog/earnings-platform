require('dotenv').config({ path: '.env.local' });

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Extract the project reference from the URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

async function applyMigration() {
  console.log('========================================');
  console.log('APPLYING MIGRATION: 2025052201_fix_personal_day2_progression.sql');
  console.log('========================================\n');

  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '2025052201_fix_personal_day2_progression.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Migration file found:', migrationPath);
  console.log('Attempting to apply via psql...\n');

  // Try using psql with the connection string
  // The connection string format for Supabase is:
  // postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  
  // We need to extract the password from the service role key or get it from environment
  // Since we don't have the database password directly, we'll try a different approach
  
  console.log('⚠️  psql requires database password which is not available in environment variables.');
  console.log('\nPlease run the migration manually in Supabase SQL Editor:');
  console.log('========================================');
  console.log('STEPS TO APPLY MIGRATION:');
  console.log('========================================');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to "SQL Editor" in the left sidebar');
  console.log('4. Click "New Query"');
  console.log('5. Copy and paste the contents of:');
  console.log('   supabase/migrations/2025052201_fix_personal_day2_progression.sql');
  console.log('6. Click "Run" (or press Ctrl+Enter)');
  console.log('7. You should see: ✅ Personal Day 2 progression fix migration completed successfully!');
  console.log('\n========================================');
  console.log('MIGRATION CONTENTS:');
  console.log('========================================\n');
  console.log(migrationSQL);
}

applyMigration().catch(console.error);
