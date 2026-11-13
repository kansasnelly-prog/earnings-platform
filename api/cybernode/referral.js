import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.CYBERNODE_SUPABASE_URL,
    process.env.CYBERNODE_SUPABASE_SERVICE_ROLE_KEY
  );

  const { new_wallet, referrer_code } = req.body || {};
  if (!new_wallet || !referrer_code) {
    return res.status(400).json({ error: 'New wallet and referrer code required' });
  }

  const REWARD_MIN = 0.30;
  const REWARD_MAX = 0.50;
  const REWARD = parseFloat((Math.random() * (REWARD_MAX - REWARD_MIN) + REWARD_MIN).toFixed(6));

  const { data: referrer } = await supabase
    .from('cybernode_users')
    .select('*')
    .eq('wallet_address', referrer_code)
    .single();

  if (referrer) {
    await supabase
      .from('cybernode_users')
      .update({ balance_gram: Number(referrer.balance_gram) + REWARD })
      .eq('wallet_address', referrer_code);
  }

  return res.status(200).json({
    success: true,
    reward_credited: REWARD,
    referrer: referrer_code,
  });
}