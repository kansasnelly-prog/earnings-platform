const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrationStatus() {
  console.log('=== Migration Status Check ===\n');
  
  try {
    // 1. Check referral code statistics
    console.log('1. Referral code statistics:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('referral_code');
    
    if (usersError) {
      console.log('   Error:', usersError.message);
      return;
    }
    
    const totalUsers = users.length;
    const nullCodes = users.filter(u => !u.referral_code).length;
    const optFormatCodes = users.filter(u => u.referral_code && u.referral_code.match(/^OPT-[A-Z0-9]{6}$/)).length;
    const otherCodes = totalUsers - nullCodes - optFormatCodes;
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   NULL referral codes: ${nullCodes}`);
    console.log(`   OPT-XXXXXX format codes: ${optFormatCodes}`);
    console.log(`   Other format codes: ${otherCodes}`);
    
    // 2. Show users with NULL referral codes
    if (nullCodes > 0) {
      console.log('\n2. Users with NULL referral codes:');
      const { data: nullUsers } = await supabase
        .from('users')
        .select('id, email, created_at')
        .is('referral_code', null)
        .order('created_at', { ascending: false });
      
      console.log(nullUsers);
    }
    
    // 3. Test if we can insert a user without referral code (should fail if migration applied)
    console.log('\n3. Testing referral code constraint (attempting to insert user without referral code):');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        referral_code: null
      })
      .select();
    
    if (insertError) {
      console.log('   Insert failed (expected if migration applied):', insertError.message);
    } else {
      console.log('   Insert succeeded (migration NOT applied):', insertResult);
      // Clean up test user
      await supabase.from('users').delete().eq('email', testEmail);
    }
    
    // 4. Test if we can insert a user with invalid referral code format
    console.log('\n4. Testing referral code format constraint (attempting to insert with invalid format):');
    const testEmail2 = `test2-${Date.now()}@example.com`;
    const { data: insertResult2, error: insertError2 } = await supabase
      .from('users')
      .insert({
        email: testEmail2,
        referral_code: 'INVALID'
      })
      .select();
    
    if (insertError2) {
      console.log('   Insert failed (expected if migration applied):', insertError2.message);
    } else {
      console.log('   Insert succeeded (migration NOT applied):', insertResult2);
      // Clean up test user
      await supabase.from('users').delete().eq('email', testEmail2);
    }
    
    // 5. Test if new user gets auto-generated OPT code
    console.log('\n5. Testing auto-generation of OPT code (inserting user without referral_code):');
    const testEmail3 = `test3-${Date.now()}@example.com`;
    const { data: insertResult3, error: insertError3 } = await supabase
      .from('users')
      .insert({
        email: testEmail3
        // not providing referral_code
      })
      .select();
    
    if (insertError3) {
      console.log('   Insert failed:', insertError3.message);
    } else {
      console.log('   Insert succeeded, generated referral code:', insertResult3[0].referral_code);
      // Clean up test user
      await supabase.from('users').delete().eq('email', testEmail3);
    }
    
    // 6. Check recent users to see pattern
    console.log('\n6. Recent users referral codes (last 10):');
    const { data: recentUsers } = await supabase
      .from('users')
      .select('email, referral_code, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    recentUsers.forEach(user => {
      console.log(`   ${user.email}: ${user.referral_code || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMigrationStatus();
