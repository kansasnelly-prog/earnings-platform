// Direct Supabase update script for fire@gmail.com
// Run with: node update-fire-user.js
// Make sure to set VITE_SUPABASE_ANON_KEY environment variable first

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Error: SUPABASE_ANON_KEY environment variable not found');
  console.error('Please run: $env:VITE_SUPABASE_ANON_KEY="your-key" (PowerShell) or export VITE_SUPABASE_ANON_KEY=your-key (Linux/Mac)');
  console.error('Then run: node update-fire-user.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateFireUser() {
  try {
    console.log('Updating fire@gmail.com user profile...');
    
    const { data, error } = await supabase
      .from('users')
      .update({
        balance: 61.38,
        total_earned: 10.25,
        account_type: 'personal'
      })
      .eq('email', 'fire@gmail.com')
      .select();
    
    if (error) {
      console.error('Error updating user:', error);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      console.log('✓ User updated successfully!');
      console.log('Email:', data[0].email);
      console.log('Balance:', data[0].balance);
      console.log('Total Earned:', data[0].total_earned);
      console.log('Account Type:', data[0].account_type);
    } else {
      console.log('No user found with email fire@gmail.com');
    }
  } catch (error) {
    console.error('Exception:', error);
    process.exit(1);
  }
}

updateFireUser();
