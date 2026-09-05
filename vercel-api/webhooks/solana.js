import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendResponse, getSupabase, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENV = loadEnv();
const TELEGRAM_BOT_TOKEN = ENV.TELEGRAM_BOT_TOKEN || '8513756424:AAFBTFeIiQA5fglLOz4HXxSixylSwGjGsgA';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function callTelegramAPI(method, payload) {
  const url = `${TELEGRAM_API_URL}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

async function sendTelegramAlert(chatId, messageText) {
  try {
    await callTelegramAPI('sendMessage', {
      chat_id: chatId,
      text: messageText,
      parse_mode: 'HTML',
    });
  } catch (e) {
    console.error('[Solana] Alert failed:', e);
  }
}

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
    const { user_telegram_id, token_symbol, amount, tx_signature } = body;

    if (!user_telegram_id || !token_symbol || !amount || !tx_signature) {
      sendResponse(res, 400, { status: 'FAILED', error: 'Missing required fields: user_telegram_id, token_symbol, amount, tx_signature' });
      return;
    }

    const multipliedAmount = Number(amount) * PROFIT_MULTIPLIER;
    const creditResult = await creditUser(
      String(user_telegram_id),
      multipliedAmount,
      token_symbol,
      'solana-payment',
      { txSignature: tx_signature, network: 'solana' }
    );

    const shortSignature = `${String(tx_signature).slice(0, 10)}...${String(tx_signature).slice(-8)}`;
    const alertMsg = `<b>Solana Payment Received!</b>\n\nAmount: <b>${multipliedAmount} ${token_symbol}</b>\nSignature: <code>${shortSignature}</code>\nMaster Wallet: <code>${MASTER_WALLET.slice(0, 8)}...</code>\nStatus: Confirmed & Ready for Swap/Withdrawal.`;

    await sendTelegramAlert(Number(user_telegram_id), alertMsg);

    sendResponse(res, 200, {
      status: 'processed',
      network: 'solana',
      tokenSymbol: token_symbol,
      amount: multipliedAmount,
      baseAmount: Number(amount),
      txSignature: tx_signature,
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[Solana] Handler error:', error);
    sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
