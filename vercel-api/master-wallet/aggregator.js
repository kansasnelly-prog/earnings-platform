import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendResponse, getSupabase, MASTER_WALLET, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendResponse(res, 200, { success: true });
    return;
  }

  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { action, userId, amount, currency, source } = body;
    const supabase = getSupabase();

    if (!supabase) {
      sendResponse(res, 500, { error: 'Supabase not configured' });
      return;
    }

    if (action === 'aggregate') {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, metadata, created_at, user_id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        sendResponse(res, 500, { error: 'Failed to fetch transactions' });
        return;
      }

      const totals = (transactions || []).reduce(
        (acc, tx) => {
          const meta = tx.metadata || {};
          const src = meta.source || 'unknown';
          const amt = Number(tx.amount) || 0;
          acc[src] = (acc[src] || 0) + amt;
          acc.total = (acc.total || 0) + amt;
          return acc;
        },
        { total: 0 }
      );

      const masterCut = totals.total * 0.15;

      sendResponse(res, 200, {
        success: true,
        totals,
        masterCut,
        masterWallet: MASTER_WALLET,
        transactionCount: transactions?.length || 0,
      });
    } else if (action === 'pull-profit') {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, balance, total_earned, wallet_address')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        sendResponse(res, 404, { error: 'User not found' });
        return;
      }

      const profitAmount = Number(amount) || (profile.balance || 0);
      const masterCut = profitAmount * 0.15;
      const userPayout = profitAmount - masterCut;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: Math.max(0, (profile.balance || 0) - profitAmount),
          total_earned: Math.max(0, (profile.total_earned || 0) - profitAmount),
        })
        .eq('id', userId);

      if (updateError) {
        sendResponse(res, 500, { error: 'Failed to update balance' });
        return;
      }

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'profit_pull',
        amount: profitAmount,
        description: `12x profit pull to master wallet (${source || 'aggregated'})`,
        status: 'completed',
        metadata: {
          action: 'pull-profit',
          master_wallet: MASTER_WALLET,
          master_cut: masterCut,
          user_payout: userPayout,
          currency: currency || 'USDT',
          source: source || 'aggregated',
        },
        created_at: new Date().toISOString(),
      });

      if (txError) {
        console.error('[MasterWallet] Transaction log failed:', txError);
      }

      sendResponse(res, 200, {
        success: true,
        profitAmount,
        masterCut,
        userPayout,
        masterWallet: MASTER_WALLET,
        currency: currency || 'USDT',
        source: source || 'aggregated',
      });
    } else {
      sendResponse(res, 400, { error: 'Invalid action. Use "aggregate" or "pull-profit".' });
    }
  } catch (error) {
    console.error('[MasterWallet] Handler error:', error);
    sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}

export default handler;
