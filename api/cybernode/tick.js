import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.CYBERNODE_SUPABASE_URL,
    process.env.CYBERNODE_SUPABASE_SERVICE_ROLE_KEY
  );

  const { wallet_address } = req.body || {};
  if (!wallet_address) {
    return res.status(400).json({ error: 'Wallet required' });
  }

  const { data: user, error } = await supabase
    .from('cybernode_users')
    .select('*')
    .eq('wallet_address', wallet_address)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const now = new Date();
  const lastMined = new Date(user.last_mined_at);
  const hoursElapsed = (now.getTime() - lastMined.getTime()) / (1000 * 60 * 60);

  const earnedIncrement = hoursElapsed * (Number(user.mining_speed) / 24);
  const newBalance = Number(user.balance_gram) + earnedIncrement;

  await supabase
    .from('cybernode_users')
    .update({
      balance_gram: newBalance,
      last_mined_at: now.toISOString(),
    })
    .eq('wallet_address', wallet_address);

  return res.status(200).json({
    success: true,
    balance_gram: newBalance,
    added: earnedIncrement,
  });
}