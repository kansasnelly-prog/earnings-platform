import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Gift {
  id: string;
  name: string;
  coin_cost: number;
}

export function useCreatorEconomy(userId: string) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      const { data } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (data) setBalance(data.balance);
    };
    fetchBalance();
  }, [userId]);

  const sendGift = async (creatorId: string, gift: Gift) => {
    if (balance < gift.coin_cost) throw new Error('Insufficient coins');

    // Deduct coins and record transaction
    await supabase.from('users').update({ balance: balance - gift.coin_cost }).eq('id', userId);
    await supabase.from('user_coin_transactions').insert({ user_id: userId, type: 'gift', amount: -gift.coin_cost, metadata: { giftId: gift.id, creatorId } });
    
    // Add earnings to creator (simplified: direct balance update + transaction)
    await supabase.from('users').update({ balance: supabase.rpc('increment_balance', { amount: gift.coin_cost * 0.5, user_id: creatorId }) }).eq('id', creatorId);
    await supabase.from('revenue_transactions').insert({ user_id: creatorId, type: 'earning', amount: gift.coin_cost * 0.5, description: 'Gift earning' });

    setBalance(prev => prev - gift.coin_cost);
  };

  return { balance, sendGift };
}
