// Script to insert minimal sample data for TikTok6 revenue flow verification
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function insertSampleData() {
  // 1. Insert a creator user (if not exists)
  // Insert a creator user (if not exists)
  const { data: creator, error: creatorErr } = await supabase
    .from('users')
    .insert({
      email: 'creator@example.com',
      display_name: 'Creator',
      account_type: 'personal',
      balance: 0,
      total_earned: 0,
    })
    .select();
  if (creatorErr && !creatorErr.message.includes('duplicate')) {
    console.error('Creator insert error:', creatorErr);
    return;
  }
  const creatorId = creator?.[0]?.id || (await supabase
    .from('users')
    .select('id')
    .eq('email', 'creator@example.com')
    .single()).data.id;

  // 2. Insert a gift revenue transaction for the creator
  // Insert a gift revenue transaction using the correct column name `amount_usd`
  const { error: giftErr } = await supabase.from('revenue_transactions').insert({
    user_id: creatorId,
    revenue_source: 'referral',
    amount_usd: 5.0,
    nelly_coins_minted: 0,
    description: 'Test gift transaction',
  });
  if (giftErr) console.error('Gift insert error:', giftErr);

  // 3. Generate a TYY referral code and store it
  const referralCode = 'TYY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const { error: refErr } = await supabase.from('tiktok6_referrals').insert({
    user_id: creatorId,
    referral_code: referralCode,
    referred_by: null,
  });
  if (refErr) console.error('Referral insert error:', refErr);

  // 4. Record referral revenue linked to that code
  const { error: revErr } = await supabase.from('tiktok6_referral_revenue').insert({
    referral_owner_code: referralCode,
    referred_user_id: creatorId,
    revenue_amount: 2.5,
    source: 'gift',
  });
  if (revErr) console.error('Referral revenue insert error:', revErr);

  console.log('Sample data inserted. Referral code:', referralCode);
}

insertSampleData();
