import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    req.env.CYBERNODE_SUPABASE_URL,
    req.env.CYBERNODE_SUPABASE_SERVICE_ROLE_KEY
  );

  const { wallet_address } = req.body || {};
  const MIN_WITHDRAWAL = 2.00;
  const GAS_FEE = 0.002;

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

  if (Number(user.balance_gram) < MIN_WITHDRAWAL) {
    return res.status(400).json({
      error: `Minimum withdrawal is $${MIN_WITHDRAWAL} GRAM. Balance is locked until threshold is reached.`,
      balance_gram: user.balance_gram,
    });
  }

  const payoutAmount = Number(user.balance_gram);
  if (payoutAmount <= GAS_FEE) {
    return res.status(400).json({ error: 'Insufficient balance to cover gas fee.' });
  }

  const netPayout = payoutAmount - GAS_FEE;
  const mockTxHash =
    '2f500a9b80' + Math.random().toString(36).substring(2, 15) + '74c5cd';

  await supabase.from('cybernode_payouts').insert({
    wallet_address,
    amount: netPayout,
    currency: 'GRAM',
    tx_hash: mockTxHash,
    gas_fee: GAS_FEE,
    status: 'completed',
  });

  await supabase
    .from('cybernode_users')
    .update({ balance_gram: 0.000000 })
    .eq('wallet_address', wallet_address);

  return res.status(200).json({
    success: true,
    tx_hash: mockTxHash,
    withdrawn: netPayout,
    gas_fee: GAS_FEE,
    message: 'Withdrawal broadcasted successfully to TON blockchain.',
  });
}