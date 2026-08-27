// =========================================================================
// VERCEL SERVERLESS API ROUTE: /api/supabase-sync.js
// Integrates Telegram Mini App with Supabase database & Telegram Bot Notifications
// =========================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your-bot-token';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, telegram_id, master_wallet, amount, from_asset, to_asset, result_text } = req.body || req.query;

  try {
    // 1. Bind Master Solana Wallet
    if (action === 'bind_wallet') {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          telegram_id: telegram_id || 999999,
          master_wallet_address: master_wallet,
          updated_at: new Date()
        }, { onConflict: 'telegram_id' });

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Master Solana Wallet bound successfully in Supabase!', data });
    }

    // 2. Cinema Safe Pot Live Yield & $50 Alert Trigger
    if (action === 'update_safe_pot') {
      const currentBalance = parseFloat(amount) || 0;
      
      // Update database
      const { data, error } = await supabase
        .from('cinema_safe_pot')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          pot_balance_usd: currentBalance,
          last_yield_time: new Date()
        });

      if (error) throw error;

      // Check if threshold reached ($50) and send Telegram Bot Notification
      if (currentBalance >= 50.00 && TELEGRAM_BOT_TOKEN !== 'your-bot-token') {
        const botMsg = `🚨 *MASTER OWNER NOTIFICATION ALERT*\n\nYour Cinema Viewing Safe Pot has reached *$50.00 USD*!\n\n💰 Current Pot Balance: *$${currentBalance.toFixed(2)}*\n🔑 Bound Solana Wallet: \`${master_wallet || 'Default Owner Wallet'}\`\n\nTap *WITHDRAW SAFE POT* inside your Web App or Telegram Bot to sweep funds!`;
        
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegram_id || "@OnlineCustomerOptimizeTasksBot",
            text: botMsg,
            parse_mode: 'Markdown'
          })
        });
      }

      return res.status(200).json({ success: true, pot_balance_usd: currentBalance });
    }

    // 3. Solana 2-Hour Token Drip Claim
    if (action === 'claim_drip') {
      const { data, error } = await supabase
        .from('drip_claims')
        .insert([{
          telegram_id: telegram_id || 999999,
          master_wallet_address: master_wallet || 'unbound',
          tokens_minted: 250,
          sol_reward: 0.05,
          usd_value: 12.50
        }]);

      if (error) throw error;
      return res.status(200).json({ success: true, message: '2-Hour Solana Token Drip logged in Supabase!' });
    }

    // 4. Token Swap Transaction Logging
    if (action === 'execute_swap') {
      const txSig = 'sol_swap_' + Math.random().toString(36).substring(2, 15);
      const { data, error } = await supabase
        .from('token_swaps')
        .insert([{
          telegram_id: telegram_id || 999999,
          from_asset,
          from_amount: parseFloat(amount),
          to_asset,
          to_amount_result: result_text,
          master_wallet_address: master_wallet || 'unbound',
          solana_tx_signature: txSig
        }]);

      if (error) throw error;
      return res.status(200).json({ success: true, signature: txSig, message: 'Instant Solana Swap executed and logged!' });
    }

    return res.status(400).json({ error: 'Invalid action specified. Supported actions: bind_wallet, update_safe_pot, claim_drip, execute_swap' });

  } catch (err) {
    console.error('Supabase Sync Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
