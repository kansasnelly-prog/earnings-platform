import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentReferralCodes() {
  console.log('Checking most recent user referral codes...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, referral_code, account_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('RECENT USER REFERRAL CODES:');
    console.log('================================\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Referral Code: ${user.referral_code}`);
      console.log(`   Account Type: ${user.account_type}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Starts with OPT-: ${user.referral_code?.startsWith('OPT-') || false}`);
      console.log('');
    });
    
    // Check training accounts
    const { data: trainingAccounts, error: trainingError } = await supabase
      .from('training_accounts')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!trainingError && trainingAccounts) {
      console.log('\nRECENT TRAINING ACCOUNTS:');
      console.log('============================\n');
      
      trainingAccounts.forEach((account, index) => {
        console.log(`${index + 1}. Email: ${account.email}`);
        console.log(`   Created: ${account.created_at}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentReferralCodes();
