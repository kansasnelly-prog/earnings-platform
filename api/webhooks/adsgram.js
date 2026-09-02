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
    console.error('[Adsgram] Alert failed:', e);
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
    const params = req.query_params || {};
    const userTelegramId = params.userid || req.body?.userid;
    const rewardAmount = parseFloat(params.reward || req.body?.reward || '0.005');
    const txId = params.eventid || req.body?.eventid || 'N/A';

    if (!userTelegramId) {
      sendResponse(res, 400, { status: 'FAILED', error: 'Missing userid' });
      return;
    }

    const multipliedReward = rewardAmount * PROFIT_MULTIPLIER;
    const creditResult = await creditUser(
      String(userTelegramId),
      multipliedReward,
      'USDT',
      'adsgram-rewarded-video',
      { eventId: txId, network: 'adsgram' }
    );

    const alertMsg = `<b>Ad View Completed!</b>\n\nReward Earned: <b>$${multipliedReward.toFixed(4)} USDT</b>\nEvent ID: <code>${txId}</code>\nMaster Wallet: <code>${MASTER_WALLET.slice(0, 8)}...</code>\nYour balance has been updated automatically.`;

    await sendTelegramAlert(Number(userTelegramId), alertMsg);

    sendResponse(res, 200, {
      status: 'success',
      rewarded: true,
      network: 'adsgram',
      reward: multipliedReward,
      baseReward: rewardAmount,
      eventId: txId,
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[Adsgram] Handler error:', error);
    sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
