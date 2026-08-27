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
    console.error('[Solana] Alert failed:', e);
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
    const body = req.body || {};
    const { user_telegram_id, token_symbol, amount, tx_signature } = body;

    if (!user_telegram_id || !token_symbol || !amount || !tx_signature) {
      return sendResponse(res, 400, { status: 'FAILED', error: 'Missing required fields: user_telegram_id, token_symbol, amount, tx_signature' });
    }

    const shortSignature = `${String(tx_signature).slice(0, 10)}...${String(tx_signature).slice(-8)}`;
    const alertMsg = `<b>Solana Payment Received!</b>\n\nAmount: <b>${amount} ${token_symbol}</b>\nSignature: <code>${shortSignature}</code>\nStatus: Confirmed & Ready for Swap/Withdrawal.`;

    await sendTelegramAlert(Number(user_telegram_id), alertMsg);

    return sendResponse(res, 200, {
      status: 'processed',
      network: 'solana',
      tokenSymbol: token_symbol,
      amount: Number(amount),
      txSignature: tx_signature,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[Solana] Handler error:', error);
    return sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
