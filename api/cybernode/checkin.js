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

  const { data: user } = await supabase
    .from('cybernode_users')
    .select('*')
    .eq('wallet_address', wallet_address)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const now = new Date();
  const lastCheckIn = user.last_check_in ? new Date(user.last_check_in) : null;
  let streak = user.daily_streak || 0;

  if (lastCheckIn) {
    const diffDays = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      streak += 1;
    } else if (diffDays === 0) {
      return res.status(400).json({ error: 'Already checked in today', streak });
    }
  } else {
    streak = 1;
  }

  const checkinReward = parseFloat((0.01 + streak * 0.005).toFixed(6));
  const newBalance = Number(user.balance_gram) + checkinReward;

  await supabase
    .from('cybernode_users')
    .update({
      balance_gram: newBalance,
      daily_streak: streak,
      last_check_in: now.toISOString(),
    })
    .eq('wallet_address', wallet_address);

  return res.status(200).json({
    success: true,
    streak,
    reward: checkinReward,
    new_balance: newBalance,
    message: `Daily check-in claimed! +${checkinReward} GRAM. Streak: ${streak} days.`,
  });
}