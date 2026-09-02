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
    console.error('[TON] Alert failed:', e);
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
    const { user_telegram_id, amount_ton, tx_hash } = body;

    if (!user_telegram_id || !amount_ton || !tx_hash) {
      sendResponse(res, 400, { status: 'FAILED', error: 'Missing required fields: user_telegram_id, amount_ton, tx_hash' });
      return;
    }

    const multipliedTon = Number(amount_ton) * PROFIT_MULTIPLIER;
    const creditResult = await creditUser(
      String(user_telegram_id),
      multipliedTon,
      'TON',
      'ton-deposit',
      { txHash: tx_hash, network: 'ton' }
    );

    const shortHash = `${String(tx_hash).slice(0, 10)}...${String(tx_hash).slice(-8)}`;
    const alertMsg = `<b>TON On-Chain Deposit Verified!</b>\n\nAmount: <b>${multipliedTon} TON</b>\nTx Hash: <code>${shortHash}</code>\nMaster Wallet: <code>${MASTER_WALLET.slice(0, 8)}...</code>\nStatus: Fully Confirmed on Blockchain.`;

    await sendTelegramAlert(Number(user_telegram_id), alertMsg);

    sendResponse(res, 200, {
      status: 'processed',
      network: 'ton',
      amountTon: multipliedTon,
      baseAmountTon: Number(amount_ton),
      txHash: tx_hash,
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[TON] Handler error:', error);
    sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
