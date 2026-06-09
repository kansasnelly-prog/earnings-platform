const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('=== Applying Migration 2026060501_fix_null_referral_codes.sql ===\n');
  
  try {
    // Step 1: Create function to generate unique referral codes
    console.log('Step 1: Creating generate_unique_referral_code function...');
    const { data: funcResult, error: funcError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION generate_unique_referral_code()
        RETURNS TEXT AS $$
        DECLARE
          new_code TEXT;
          code_exists INTEGER;
        BEGIN
          LOOP
            new_code := 'OPT-' || upper(substr(md5(random()::text), 1, 6));
            SELECT COUNT(*) INTO code_exists FROM users WHERE referral_code = new_code;
            IF code_exists = 0 THEN
              RETURN new_code;
            END IF;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (funcError) {
      console.log('   Error creating function:', funcError.message);
      // Try alternative approach using direct SQL
      console.log('   Function may already exist or RPC not available');
    } else {
      console.log('   Function created successfully');
    }
    
    // Step 2: Update users with NULL referral codes
    console.log('\nStep 2: Updating users with NULL referral codes...');
    // We'll do this by calling a function that does the update
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ referral_code: supabase.raw('generate_unique_referral_code()') })
      .is('referral_code', null)
      .select();
    
    if (updateError) {
      console.log('   Error updating users:', updateError.message);
    } else {
      console.log('   Updated users:', updateResult.length);
    }
    
    // Step 3: Verify the update
    console.log('\nStep 3: Verifying the update...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('referral_code');
    
    if (!usersError && users) {
      const totalUsers = users.length;
      const nullCodes = users.filter(u => !u.referral_code).length;
      const optFormatCodes = users.filter(u => u.referral_code && u.referral_code.match(/^OPT-[A-Z0-9]{6}$/)).length;
      
      console.log(`   Total users: ${totalUsers}`);
      console.log(`   NULL referral codes: ${nullCodes}`);
      console.log(`   OPT-XXXXXX format codes: ${optFormatCodes}`);
    }
    
    // Step 4: Try to add NOT NULL constraint
    console.log('\nStep 4: Adding NOT NULL constraint to referral_code...');
    const { data: nullResult, error: nullError } = await supabase.rpc('exec_sql', {
      sql_query: `ALTER TABLE users ALTER COLUMN referral_code SET NOT NULL;`
    });
    
    if (nullError) {
      console.log('   Error adding NOT NULL constraint:', nullError.message);
    } else {
      console.log('   NOT NULL constraint added successfully');
    }
    
    // Step 5: Try to add CHECK constraint
    console.log('\nStep 5: Adding CHECK constraint for OPT-XXXXXX format...');
    const { data: checkResult, error: checkError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE users 
        ADD CONSTRAINT referral_code_format_check 
        CHECK (referral_code ~ '^OPT-[A-Z0-9]{6}$');
      `
    });
    
    if (checkError) {
      console.log('   Error adding CHECK constraint:', checkError.message);
    } else {
      console.log('   CHECK constraint added successfully');
    }
    
    // Step 6: Create trigger function
    console.log('\nStep 6: Creating trigger function ensure_referral_code...');
    const { data: triggerFuncResult, error: triggerFuncError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION ensure_referral_code()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.referral_code IS NULL THEN
            NEW.referral_code := generate_unique_referral_code();
          END IF;
          IF NEW.referral_code !~ '^OPT-[A-Z0-9]{6}$' THEN
            RAISE EXCEPTION 'Referral code must be in format OPT-XXXXXX';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (triggerFuncError) {
      console.log('   Error creating trigger function:', triggerFuncError.message);
    } else {
      console.log('   Trigger function created successfully');
    }
    
    // Step 7: Create INSERT trigger
    console.log('\nStep 7: Creating INSERT trigger...');
    const { data: insertTriggerResult, error: insertTriggerError } = await supabase.rpc('exec_sql', {
      sql_query: `
        DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON users;
        CREATE TRIGGER ensure_referral_code_trigger
        BEFORE INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION ensure_referral_code();
      `
    });
    
    if (insertTriggerError) {
      console.log('   Error creating INSERT trigger:', insertTriggerError.message);
    } else {
      console.log('   INSERT trigger created successfully');
    }
    
    // Step 8: Create UPDATE trigger
    console.log('\nStep 8: Creating UPDATE trigger...');
    const { data: updateTriggerResult, error: updateTriggerError } = await supabase.rpc('exec_sql', {
      sql_query: `
        DROP TRIGGER IF EXISTS ensure_referral_code_update_trigger ON users;
        CREATE TRIGGER ensure_referral_code_update_trigger
        BEFORE UPDATE OF referral_code ON users
        FOR EACH ROW
        EXECUTE FUNCTION ensure_referral_code();
      `
    });
    
    if (updateTriggerError) {
      console.log('   Error creating UPDATE trigger:', updateTriggerError.message);
    } else {
      console.log('   UPDATE trigger created successfully');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

applyMigration();
