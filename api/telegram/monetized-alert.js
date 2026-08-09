import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL ERROR: Supabase credentials missing for telegram monetized alert API.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MASTER_SOL_WALLET = process.env.MASTER_SOL_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';
const TELEGRAM_MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'https://earnings-ink.vercel.app';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function getTelegramBotToken() {
  const token = TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  return token;
}

async function getSponsoredAlert(type = 'default') {
  try {
    const { data, error } = await supabase
      .from('sponsored_alerts')
      .select('message, is_active')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.message) return null;
    return data.message;
  } catch (error) {
    console.error('[SponsoredAlert] Failed to fetch:', error);
    return null;
  }
}

async function logRevenueTransaction({ userId, amountSol, transactionType, txHash, metadata = {} }) {
  try {
    const { error } = await supabase.from('revenue_transactions').insert({
      user_id: userId || null,
      amount_sol: amountSol,
      transaction_type: transactionType,
      tx_hash: txHash || null,
      metadata: {
        ...metadata,
        platform: 'telegram',
        master_wallet: MASTER_SOL_WALLET,
      },
    });

    if (error) {
      console.error('[RevenueTransaction] Failed to log:', error);
    }
  } catch (error) {
    console.error('[RevenueTransaction] Exception:', error);
  }
}

function buildMonetizedInlineKeyboard(sponsoredFooter) {
  const tipPayload = encodeURIComponent(JSON.stringify({
    asset: { chain: 'SOL', amount: 0.01, mint: 'SOL' },
    to: MASTER_SOL_WALLET,
    label: 'Tip Admin 0.01 SOL',
  }));

  const deepLink = `${TELEGRAM_MINI_APP_URL}?startapp=watch`;

  return {
    inline_keyboard: [
      [
        {
          text: '⚡ Tip Admin (0.01 SOL)',
          url: `https://phantom.to/tx?${tipPayload}`,
        },
        {
          text: '📺 Watch & Earn (App)',
          url: deepLink,
        },
      ],
      ...(sponsoredFooter
        ? [
            [
              {
                text: '📢 Sponsored',
                url: sponsoredFooter.startsWith('http') ? sponsoredFooter : TELEGRAM_MINI_APP_URL,
              },
            ],
          ]
        : []),
    ],
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { chatId, message, messageType = 'default', userId, sponsoredType = 'default' } = body || {};

    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId and message are required' });
    }

    const sponsoredAlert = await getSponsoredAlert(sponsoredType);
    const fullMessage = sponsoredAlert ? `${sponsoredAlert}\n\n${message}` : message;
    const replyMarkup = buildMonetizedInlineKeyboard(sponsoredAlert);

    const token = getTelegramBotToken();
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: fullMessage,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[MonetizedAlert] Telegram API error:', text);
      return res.status(500).json({ error: 'Failed to send monetized alert' });
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('[MonetizedAlert] Telegram API returned error:', data);
      return res.status(500).json({ error: data.description || 'Telegram API error' });
    }

    if (userId) {
      void logRevenueTransaction({
        userId,
        amountSol: 0,
        transactionType: 'alert_sponsor',
        txHash: null,
        metadata: {
          chatId,
          messageType,
          sponsoredType,
          telegram_message_id: data.result?.message_id,
        },
      });
    }

    return res.status(200).json({ success: true, messageId: data.result?.message_id });
  } catch (error) {
    console.error('[MonetizedAlert] Exception:', error);
    return res.status(500).json({ error: 'Monetized alert failed', message: error.message });
  }
}
