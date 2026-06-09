require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

async function applyMigration() {
  console.log('========================================');
  console.log('APPLYING MIGRATION: 2026060501_fix_null_referral_codes.sql');
  console.log('========================================\n');

  const migrationSQL = `
-- Migration: Fix NULL referral codes for existing users
-- This migration finds users where referral_code IS NULL and generates unique OPT- codes for them

-- Step 1: Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists INTEGER;
BEGIN
  LOOP
    -- Generate a new OPT-XXXXXX code
    new_code := 'OPT-' || upper(substr(md5(random()::text), 1, 6));
    
    -- Check if this code already exists
    SELECT COUNT(*) INTO code_exists
    FROM users
    WHERE referral_code = new_code;
    
    -- If code doesn't exist, return it
    IF code_exists = 0 THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update all users with NULL referral codes
UPDATE users
SET referral_code = generate_unique_referral_code()
WHERE referral_code IS NULL;

-- Step 3: Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN referral_code IS NULL THEN 1 END) as null_referral_codes,
  COUNT(CASE WHEN referral_code LIKE 'OPT-%' THEN 1 END) as opt_format_codes
FROM users;

-- Step 4: Add NOT NULL constraint to referral_code column
ALTER TABLE users
ALTER COLUMN referral_code SET NOT NULL;

-- Step 5: Add check constraint to ensure OPT-XXXXXX format
ALTER TABLE users
ADD CONSTRAINT referral_code_format_check 
CHECK (referral_code ~ '^OPT-[A-Z0-9]{6}$');

-- Step 6: Create a trigger to automatically generate referral codes on insert
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If referral_code is NULL, generate one
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_unique_referral_code();
  END IF;
  
  -- Validate the format
  IF NEW.referral_code !~ '^OPT-[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'Referral code must be in format OPT-XXXXXX (6 alphanumeric characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Apply the trigger before insert
DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON users;
CREATE TRIGGER ensure_referral_code_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_referral_code();

-- Step 8: Apply the trigger before update
DROP TRIGGER IF EXISTS ensure_referral_code_update_trigger ON users;
CREATE TRIGGER ensure_referral_code_update_trigger
BEFORE UPDATE OF referral_code ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_referral_code();
`;

  console.log('Executing migration SQL via REST API...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: migrationSQL })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Migration failed:', data);
      throw new Error(data.message || 'Migration failed');
    }

    console.log('✅ Migration applied successfully');
    console.log('Result:', data);
  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    console.error('\n⚠️  Cannot execute DDL via REST API.');
    console.log('Please run the migration manually in Supabase SQL Editor:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Create new query');
    console.log('4. Paste the contents of: supabase/migrations/2026060501_fix_null_referral_codes.sql');
    console.log('5. Click "Run"');
  }
}

applyMigration().catch(console.error);
