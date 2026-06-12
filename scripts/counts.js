// Script to output row counts for key tables
import { supabaseAdmin } from './supabaseAdmin.js';

async function getCount(table) {
  const { count, error } = await supabaseAdmin
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
  // Example revenue source query: sum of gift earnings
  const { data: giftSum, error: giftErr } = await supabaseAdmin
    .from('revenue_transactions')
    .select('amount', { count: 'exact', head: false })
    .eq('type', 'gift');
  if (!giftErr && giftSum) {
    const total = giftSum.reduce((s, r) => s + Number(r.amount), 0);
    console.log(`Total gift revenue: $${total.toFixed(2)}`);
  }
}

main();
