import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
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
const TELEGRAM_CHAT_ID = ENV.TELEGRAM_CHAT_ID || '';
const MASTER_EMAIL = ENV.MASTER_EMAIL || 'kansasnelly@gmail.com';
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
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

async function sendTelegramAlert(message, options = {}) {
  const chatId = options.chatId || TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn('[TelegramAlert] No chat ID configured');
    return { ok: false, error: 'No chat ID configured' };
  }

  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: options.disablePreview || false,
    ...options,
  };

  try {
    const result = await callTelegramAPI('sendMessage', payload);
    return result;
  } catch (error) {
    console.error('[TelegramAlert] Failed to send alert:', error);
    return { ok: false, error: error.message };
  }
}

function generateExecutiveAlertHTML(type, data) {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    hour12: false,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  switch (type) {
    case 'yield':
      return `
<b>💰 SOL YIELD EXECUTED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Amount:</b> <code>${data.amount || '0.00'} SOL</code>
<b>Recipient:</b> <code>${data.recipient || MASTER_WALLET}</code>
<b>Signature:</b> <code>${data.signature || 'N/A'}</code>
<b>Status:</b> <code>${data.status || 'CONFIRMED'}</code>
<b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Master Vault:</b> <code>${MASTER_WALLET}</code>
<b>Network:</b> Solana Mainnet
      `.trim();

    case 'revenue_pulse':
      return `
<b>⚡ REVENUE PULSE ACTIVE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Cycle:</b> 45-Minute Executive Pulse
<b>Status:</b> <code>ACTIVE</code>
<b>Gathered:</b> <code>${data.gathered || '0.00'} / ${data.target || '100'}</code>
<b>Master Wallet:</b> <code>${MASTER_WALLET.slice(0, 8)}...</code>
<b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━
<i>Auto-flush cycle initiated. Revenue aggregation in progress.</i>
      `.trim();

    case 'transaction_alert':
      return `
<b>🔔 TRANSACTION ALERT</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Type:</b> ${data.type || 'DEPOSIT'}
<b>Amount:</b> <code>${data.amount || '0.00'} SOL</code>
<b>From:</b> <code>${data.from || 'N/A'}</code>
<b>To:</b> <code>${data.to || MASTER_WALLET}</code>
<b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━
<i>On-chain verification complete.</i>
      `.trim();

    case 'executive_broadcast':
      return `
<b>📢 EXECUTIVE BROADCAST</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
${data.message || 'SREYMARA Executive Update'}
<b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>SREYMARA</b> | Executive Network
      `.trim();

    default:
      return `
<b>🔔 SREYMARA ALERT</b>
${data.message || 'System notification'}
<b>Time:</b> ${timestamp}
      `.trim();
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
    const { type, data, chatId, message } = body;

    let alertMessage;
    if (message) {
      alertMessage = message;
    } else if (type) {
      alertMessage = generateExecutiveAlertHTML(type, data || {});
    } else {
      return sendResponse(res, 400, { error: 'Missing type or message field' });
    }

    const result = await sendTelegramAlert(alertMessage, { chatId });

    if (result.ok) {
      console.log(`[TelegramAlert] Alert sent successfully: ${type || 'custom'}`);
      return sendResponse(res, 200, {
        success: true,
        messageId: result.result?.message_id,
        type: type || 'custom',
      });
    } else {
      console.error('[TelegramAlert] Telegram API error:', result);
      return sendResponse(res, 500, {
        success: false,
        error: result.description || 'Failed to send Telegram alert',
      });
    }
  } catch (error) {
    console.error('[TelegramAlert] Handler error:', error);
    return sendResponse(res, 500, {
      success: false,
      error: error.message,
    });
  }
}

export default handler;
