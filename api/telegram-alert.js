import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendResponse, getSupabase, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function callTelegramAPI(method, payload) {
  const env = loadEnv();
  const token = env.TELEGRAM_BOT_TOKEN || '';
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

async function sendTelegramAlert(message, options = {}) {
  const env = loadEnv();
  const chatId = options.chatId || env.TELEGRAM_CHAT_ID || '';
  if (!chatId) {
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
  const env = loadEnv();
  const masterWallet = env.MASTER_WALLET || MASTER_WALLET;
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
<b>Recipient:</b> <code>${data.recipient || masterWallet}</code>
<b>Signature:</b> <code>${data.signature || 'N/A'}</code>
<b>Status:</b> <code>${data.status || 'CONFIRMED'}</code>
<b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Master Vault:</b> <code>${masterWallet}</code>
<b>Network:</b> Solana Mainnet
      `.trim();

    case 'revenue_pulse':
      return `
<b>⚡ REVENUE PULSE ACTIVE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Cycle:</b> 45-Minute Executive Pulse
<b>Status:</b> <code>ACTIVE</code>
<b>Gathered:</b> <code>${data.gathered || '0.00'} / ${data.target || '100'}</code>
<b>Master Wallet:</b> <code>${masterWallet.slice(0, 8)}...</code>
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
<b>To:</b> <code>${data.to || masterWallet}</code>
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
    sendResponse(res, 200, { success: true });
    return;
  }

  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { type, data, chatId, message, userId, amount, currency } = body;

    let alertMessage;
    if (message) {
      alertMessage = message;
    } else if (type) {
      alertMessage = generateExecutiveAlertHTML(type, data || {});
    } else {
      sendResponse(res, 400, { error: 'Missing type or message field' });
      return;
    }

    const result = await sendTelegramAlert(alertMessage, { chatId });

    if (result.ok) {
      const creditResult = await creditUser(
        userId,
        amount || (data?.amount || 0.01),
        currency || 'USDT',
        'telegram-alert',
        { alertType: type, chatId }
      );

      console.log(`[TelegramAlert] Alert sent successfully: ${type || 'custom'}`);
      sendResponse(res, 200, {
        success: true,
        messageId: result.result?.message_id,
        type: type || 'custom',
        telegramResult: result,
        creditResult,
        masterWallet: MASTER_WALLET,
      });
    } else {
      console.error('[TelegramAlert] Telegram API error:', result);
      sendResponse(res, 500, {
        success: false,
        error: result.description || 'Failed to send Telegram alert',
      });
    }
  } catch (error) {
    console.error('[TelegramAlert] Handler error:', error);
    sendResponse(res, 500, {
      success: false,
      error: error.message,
    });
  }
}

export default handler;
