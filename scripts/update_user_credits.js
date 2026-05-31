// This script updates the credit balance for a specific user.
// Usage: node scripts/update_user_credits.js <user_id> <credits>
// Example: node scripts/update_user_credits.js 123e4567-e89b-12d3-a456-426614174000 100

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const [,, userId, credits] = process.argv;

if (!userId || !credits) {
  console.error('Usage: node scripts/update_user_credits.js <user_id> <credits>');
  process.exit(1);
}

async function update() {
  const { error } = await supabase
    .from('user_credits')
    .upsert({ user_id: userId, credit_balance: Number(credits) }, { onConflict: 'user_id' });
  if (error) {
    console.error('Error updating credits:', error);
    process.exit(1);
  }
  console.log(`Updated user ${userId} to ${credits} credits.`);
}

update();
