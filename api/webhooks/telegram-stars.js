import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      envVars[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return envVars;
}

const ENV = loadEnv();
const TELEGRAM_BOT_TOKEN = ENV.TELEGRAM_BOT_TOKEN || '8513756424:AAFBTFeIiQA5fglLOz4HXxSixylSwGjGsgA';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const MASTER_WALLET = ENV.MASTER_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

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
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method Not Allowed' });
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
    const amountStars = payment.total_amount;
    const txId = payment.telegram_payment_charge_id;

    const alertMsg = `<b>Instant Payment Confirmation!</b>\n\nReceived: <b>${amountStars} Stars (XTR)</b>\nCharge ID: <code>${txId}</code>\nStatus: Credited to SREYMARA Wallet.`;

    await sendTelegramAlert(chatId, alertMsg);

    return sendResponse(res, 200, {
      status: 'processed',
      network: 'telegram-stars',
      amountStars,
      txId,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[TelegramStars] Handler error:', error);
    return sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
