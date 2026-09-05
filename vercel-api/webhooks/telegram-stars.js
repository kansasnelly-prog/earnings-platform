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
    console.error('[TelegramStars] Alert failed:', e);
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
    const data = req.body || {};

    if (data.pre_checkout_query?.id) {
      await callTelegramAPI('answerPreCheckoutQuery', {
        pre_checkout_query_id: data.pre_checkout_query.id,
        ok: true,
      });
      return sendResponse(res, 200, { status: 'ok' });
    }

    const message = data.message || {};
    const payment = message.successful_payment;
    if (!payment) {
      return sendResponse(res, 400, { status: 'ignored', reason: 'no_payment' });
    }

    const chatId = message.chat.id;
    const amountStars = Number(payment.total_amount) || 0;
    const txId = payment.telegram_payment_charge_id;

    const multipliedStars = amountStars * PROFIT_MULTIPLIER;
    const creditResult = await creditUser(
      String(chatId),
      multipliedStars,
      'Stars',
      'telegram-stars',
      { txId, network: 'telegram-stars' }
    );

    const alertMsg = `<b>Instant Payment Confirmation!</b>\n\nReceived: <b>${multipliedStars} Stars (XTR)</b>\nCharge ID: <code>${txId}</code>\nMaster Wallet: <code>${MASTER_WALLET.slice(0, 8)}...</code>\nStatus: Credited to SREYMARA Wallet.`;

    await sendTelegramAlert(chatId, alertMsg);

    sendResponse(res, 200, {
      status: 'processed',
      network: 'telegram-stars',
      amountStars: multipliedStars,
      baseAmountStars: amountStars,
      txId,
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[TelegramStars] Handler error:', error);
    sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
