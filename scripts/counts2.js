// Direct script to query key tables without relying on supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getCount(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`Error counting ${table}:`, error);
    return null;
  }
  return count;
}

async function main() {
  const tables = [
    'revenue_transactions',
    'admin_revenue',
    'tiktok6_referrals',
    'tiktok6_referral_tracking',
    'tiktok6_referral_revenue',
  ];
  for (const tbl of tables) {
    const cnt = await getCount(tbl);
    console.log(`${tbl}: ${cnt}`);
  }
  // Example: total gift revenue
  const { data: gifts, error } = await supabase
    .from('revenue_transactions')
    .select('amount')
    .eq('type', 'gift');
  if (!error && gifts) {
    const total = gifts.reduce((s, r) => s + Number(r.amount), 0);
    console.log(`Total gift revenue: $${total.toFixed(2)}`);
  }
}

main();
