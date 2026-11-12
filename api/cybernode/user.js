import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    req.env.SUPABASE_URL,
    req.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { wallet_address } = req.body || {};
  const url = new URL(req.url, 'http://localhost');
  const wallet = wallet_address || url.searchParams.get('wallet_address');

  if (!wallet) {
    return res.status(400).json({ error: 'Wallet required' });
  }

  const { data: user, error } = await supabase
    .from('cybernode_users')
    .select('*')
    .eq('wallet_address', wallet)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { data: claims } = await supabase
    .from('cybernode_claims')
    .select('*')
    .eq('wallet_address', wallet);

  return res.status(200).json({
    success: true,
    user: {
      wallet_address: user.wallet_address,
      balance_gram: user.balance_gram,
      balance_usdt: user.balance_usdt,
      mining_speed: user.mining_speed,
      last_mined_at: user.last_mined_at,
      referred_by: user.referred_by,
      daily_streak: user.daily_streak,
      last_check_in: user.last_check_in,
      created_at: user.created_at,
    },
    claims: claims || [],
  });
}