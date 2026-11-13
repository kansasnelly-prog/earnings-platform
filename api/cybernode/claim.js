import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    req.env.CYBERNODE_SUPABASE_URL,
    req.env.CYBERNODE_SUPABASE_SERVICE_ROLE_KEY
  );

  const { wallet_address, section_type, claim_amount } = req.body || {};
  if (!wallet_address || !section_type) {
    return res.status(400).json({ error: 'Wallet and section type required' });
  }

  const amount = parseFloat(claim_amount) || 0.002;

  const { data: existing } = await supabase
    .from('cybernode_claims')
    .select('*')
    .eq('wallet_address', wallet_address)
    .eq('section_type', section_type)
    .single();

  if (existing) {
    await supabase
      .from('cybernode_claims')
      .update({
        unclaimed_amount: Number(existing.unclaimed_amount) + amount,
        last_claimed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    await supabase
      .from('cybernode_users')
      .update({ balance_gram: Number((await supabase.from('cybernode_users').select('balance_gram').eq('wallet_address', wallet_address).single()).data.balance_gram) + amount })
      .eq('wallet_address', wallet_address);
  } else {
    await supabase.from('cybernode_claims').insert({
      wallet_address,
      section_type,
      unclaimed_amount: amount,
      last_claimed_at: new Date().toISOString(),
    });

    const { data: user } = await supabase
      .from('cybernode_users')
      .select('balance_gram')
      .eq('wallet_address', wallet_address)
      .single();

    await supabase
      .from('cybernode_users')
      .update({ balance_gram: (Number(user?.balance_gram) || 0) + amount })
      .eq('wallet_address', wallet_address);
  }

  return res.status(200).json({
    success: true,
    section_type,
    amount,
    message: `Claimed ${amount} GRAM from ${section_type}`,
  });
}