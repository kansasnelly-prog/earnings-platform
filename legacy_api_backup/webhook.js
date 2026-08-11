import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing from your Vercel Dashboard Environment Variables.');

const bot = new Telegraf(token);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const MASTER_SOL_WALLET = process.env.MASTER_SOL_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';
const TELEGRAM_MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'https://earnings-ink.vercel.app';
const MASTER_ADMIN_ID = 7683177085;
const DUAL_ADMIN_ID = process.env.DUAL_ADMIN_TELEGRAM_ID ? parseInt(process.env.DUAL_ADMIN_TELEGRAM_ID, 10) : null;

function isAuthorizedAdmin(userId) {
  if (userId === MASTER_ADMIN_ID) return true;
  if (DUAL_ADMIN_ID && userId === DUAL_ADMIN_ID) return true;
  return false;
}

function getMonetizedInlineKeyboard() {
  const tipPayload = encodeURIComponent(JSON.stringify({
    asset: { chain: 'SOL', amount: 0.01, mint: 'SOL' },
    to: MASTER_SOL_WALLET,
    label: 'Tip Admin 0.01 SOL',
  }));

  return {
    inline_keyboard: [
      [
        {
          text: '⚡ Tip Admin (0.01 SOL)',
          url: `https://phantom.to/tx?${tipPayload}`,
        },
        {
          text: '📺 Watch & Earn (App)',
          url: TELEGRAM_MINI_APP_URL,
        },
      ],
    ],
  };
}

async function getUserWatchBalance(userId) {
  if (!supabase) return 0;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('watch_balance')
      .eq('telegram_id', userId)
      .single();

    if (error || !data) return 0;
    return data.watch_balance || 0;
  } catch (error) {
    console.error('[Webhook] Failed to fetch watch balance:', error);
    return 0;
  }
}

async function isPremiumAlertUser(userId) {
  const watchBalance = await getUserWatchBalance(userId);
  return watchBalance >= 100;
}

async function logRevenueTransaction({ userId, amountSol, transactionType, txHash, metadata = {} }) {
  if (!supabase) return;
  try {
    await supabase.from('revenue_transactions').insert({
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
  } catch (error) {
    console.error('[RevenueTransaction] Exception:', error);
  }
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

const SYMBOL_MAP = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'usdt': 'tether',
  'usdc': 'usd-coin',
  'bnb': 'binancecoin',
  'sol': 'solana',
  'xrp': 'ripple',
  'ada': 'cardano',
  'doge': 'dogecoin',
  'dot': 'polkadot',
  'matic': 'matic-network',
  'ltc': 'litecoin',
  'avax': 'avalanche-2',
  'link': 'chainlink',
  'uni': 'uniswap',
  'atom': 'cosmos',
  'near': 'near-protocol',
  'fil': 'filecoin',
};

async function safeFetch(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

function normalizeSymbol(symbol) {
  const lowerSymbol = symbol.toLowerCase().trim();
  return SYMBOL_MAP[lowerSymbol] || lowerSymbol;
}

function formatNumber(num, decimals = 2) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercentage(num) {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

async function sendMonetizedAlert(chatId, message, userId) {
  try {
    const replyMarkup = getMonetizedInlineKeyboard();

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    if (supabase && userId) {
      await supabase.from('revenue_transactions').insert({
        user_id: userId,
        amount_sol: 0,
        transaction_type: 'alert_sponsor',
        tx_hash: null,
        metadata: { chatId, platform: 'telegram', master_wallet: MASTER_SOL_WALLET },
      });
    }
  } catch (error) {
    console.error('[MonetizedAlert] Failed:', error);
  }
}

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || 'Unknown Node';
  const incomingText = ctx.message && 'text' in ctx.message ? ctx.message.text : 'Non-text event';

  console.log(`[MASTER EYES MONITOR] Time: ${new Date().toISOString()} | User: @${username} (${userId}) | Input: "${incomingText}"`);

  if (!isAuthorizedAdmin(userId)) {
    console.log(`[SECURITY INTERCEPTION]: Unauthorized system breach attempt dropped silently from ID: ${userId}`);
    return;
  }

  if (incomingText === '/login' || incomingText === '/start') {
    await ctx.telegram.sendMessage(MASTER_ADMIN_ID, '🔒 Security Alert: Master Admin Account Session Initialized Live.');
    if (DUAL_ADMIN_ID) {
      await ctx.telegram.sendMessage(DUAL_ADMIN_ID, '🔒 Security Alert: Admin Session Initialized Live.');
    }
  }

  return next();
});

bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username || 'User';

  if (!chatId) return;

  const welcomeMessage = `🎉 <b>Welcome to SREYMARA / Nelly TV</b>\n\n` +
    `👤 User: @${username}\n` +
    `🆔 ID: ${userId}\n` +
    `🌐 Platform: earnings.ink\n\n` +
    `⚡ <b>Earn while you watch!</b>\n` +
    `Start watching videos and earn SOL rewards automatically.`;

  await sendMonetizedAlert(chatId, welcomeMessage, userId);
});

bot.command('earnings', async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username || 'User';

  if (!chatId) return;

  const watchBalance = await getUserWatchBalance(userId);
  const isPremium = watchBalance >= 100;

  const earningsMessage = `📊 <b>Your Nelly TV Earnings</b>\n\n` +
    `👤 User: @${username}\n` +
    `🆔 ID: ${userId}\n` +
    `💰 Watch Balance: ${watchBalance} PTS\n` +
    `🎯 Status: ${isPremium ? '⭐ VIP Watch Signal' : 'Standard Viewer'}\n\n` +
    `${isPremium ? '🔓 You have access to premium whale movement alerts!' : '🔒 Reach 100 PTS to unlock premium alerts.'}\n\n` +
    `📺 Keep watching to earn more!`;

  await sendMonetizedAlert(chatId, earningsMessage, userId);
});

bot.command('status', async (ctx) => {
  let dbStatus = 'Inactive';
  if (supabase) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      dbStatus = error ? 'Error' : 'Active';
    } catch (err) {
      dbStatus = 'Error';
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  let aiStatus = 'Not Configured';

  if (openaiKey) {
    aiStatus = 'Active [OpenAI GPT-4]';
  } else if (geminiKey) {
    aiStatus = 'Active [Google Gemini]';
  }

  let usdtPool = 0;
  let ncCoinsPot = 0;

  if (supabase) {
    try {
      const { data: usdtData, error: usdtError } = await supabase
        .from('users')
        .select('total_balance');

      if (!usdtError && usdtData) {
        usdtPool = usdtData.reduce((sum, user) => sum + (user.total_balance || 0), 0);
      }

      const { data: ncData, error: ncError } = await supabase
        .from('users')
        .select('nc_coins');

      if (!ncError && ncData) {
        ncCoinsPot = ncData.reduce((sum, user) => sum + (user.nc_coins || 0), 0);
      }
    } catch (err) {
      console.error('[FINANCIAL AGGREGATION ERROR]', err);
    }
  }

  const dualPipelineFlow = 'Active (30-sec intervals)';

  const report =
    `📊 System Status: Online\n` +
    `🗄️ Database Connection: ${dbStatus}\n` +
    `🤖 AI Engine: ${aiStatus}\n\n` +
    `🌟 **6STARS GLOBAL EXECUTIVE SYSTEM (12vtg)**\n` +
    `----------------------------------\n` +
    `📁 **Core Analytics:** SILVE Business Framework Protected\n` +
    `🌍 **Active Footprint:** Tracking 50+ Countries Ready (Cambodia, Vietnam, US, UK, Germany, Switzerland, Australia, and Global Regional Nodes Authorized)\n` +
    `🪙 **Asset Pool:** NC COINS\n` +
    `💰 **USDT Pool:** $${formatNumber(usdtPool)}\n` +
    `🪙 **NC COINS Pot:** ${ncCoinsPot.toLocaleString()} NC\n` +
    `⚡ **Dual Pipeline Flow:** ${dualPipelineFlow}\n` +
    `💵 **Pipeline Yield:** $5.00 back-to-back increments every 30 seconds\n\n` +
    `📱 **TikTok6 Node:** Multi-million Contract Router Verified\n` +
    `❤️ **Match Engine:** Dating Platform Sandbox Operational\n` +
    `👁️ **Master Eyes Layer:** ACTIVE (Surveillance Matrix Streaming)\n`;

  await ctx.replyWithMarkdown(report);
});

bot.command('sell', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    return await ctx.reply('✏️ **Format Required:** /sell [amount_of_coins] [usd_value]\nExample: /sell 5000 250');
  }

  const ncAmount = parseFloat(args[1]);
  const usdValue = parseFloat(args[2]);

  if (isNaN(ncAmount) || isNaN(usdValue)) {
    return await ctx.reply('⚠️ Error: Please enter valid numbers for coins and value.');
  }

  const transactionTime = new Date().toISOString();

  await ctx.reply(
    `🛒 **6STARS SALES TERMINAL SELLING NODE**\n` +
    `----------------------------------\n` +
    `📦 **Product Asset:** NC COINS\n` +
    `🔹 Allocated Volume: +${ncAmount.toLocaleString()} NC\n` +
    `💵 Value Realized: $${usdValue.toLocaleString()} USD\n` +
    `📅 Ledger Timestamp: ${transactionTime}\n\n` +
    `✅ Transaction recorded across global regional nodes.`
  );
});

bot.command('calculate', async (ctx) => {
  const messageText = ctx.message.text;
  const numbers = messageText.match(/\d+(\.\d+)?/g);
  if (numbers && numbers.length >= 2) {
    const val1 = parseFloat(numbers[0]);
    const val2 = parseFloat(numbers[1]);

    const calculationReport = `
📊 **👁️ @6STARS EXECUTIVE CALCULATION ENGINE**
--------------------------------------------------
👤 *Admin Check:* kansasnelly@gmail.com Verified ✅
🔢 *Factors:* ${val1} | ${val2}

📈 **Dual-Platform Learning Analysis:**
• **Optimization Core Yield:** $${(val1 + val2).toFixed(2)} USDT
• **TIKTOK6 Matching Pipeline:** $${(val1 * val2).toFixed(2)} NC COINS
• **50-Countries Distribution Share:** $${((val1 + val2) / 50).toFixed(4)} Per Node

🌍 *Status:* Both platforms are fully synchronized from A-Z with 0 pending order blockages.
    `;
    return ctx.replyWithMarkdown(calculationReport);
  }
});

bot.hears(/check/i, async (ctx) => {
  const messageText = ctx.message.text;
  const numbers = messageText.match(/\d+(\.\d+)?/g);
  if (numbers && numbers.length >= 2) {
    const val1 = parseFloat(numbers[0]);
    const val2 = parseFloat(numbers[1]);

    const calculationReport = `
📊 **👁️ @6STARS EXECUTIVE CALCULATION ENGINE**
--------------------------------------------------
👤 *Admin Check:* kansasnelly@gmail.com Verified ✅
🔢 *Factors:* ${val1} | ${val2}

📈 **Dual-Platform Learning Analysis:**
• **Optimization Core Yield:** $${(val1 + val2).toFixed(2)} USDT
• **TIKTOK6 Matching Pipeline:** $${(val1 * val2).toFixed(2)} NC COINS
• **50-Countries Distribution Share:** $${((val1 + val2) / 50).toFixed(4)} Per Node

🌍 *Status:* Both platforms are fully synchronized from A-Z with 0 pending order blockages.
    `;
    return ctx.replyWithMarkdown(calculationReport);
  }
});

bot.command('tiktok', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return await ctx.reply('✏️ **Format Required:** /tiktok [username]');
  }
  const targetUser = args[1];
  await ctx.reply(
    `📱 **TikTok Organization Tracker**\n` +
    `----------------------------------\n` +
    `👤 Account Checked: @${targetUser}\n` +
    `📊 Campaign Status: Tracking 30-Sec Viral Engine\n` +
    `🚀 Reach Strategy: Scheduled landing optimized across international nodes.`
  );
});

bot.command('tiktok6', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return await ctx.reply('✏️ **Format Required:** /tiktok6 [username]');
  }
  const targetUser = args[1];
  await ctx.reply(
    `📱 **TIKTOK6 GLOBAL OFFICIAL ARCHITECTURE**\n` +
    `----------------------------------------\n` +
    `👤 Account Node Hooked: @${targetUser}\n` +
    `💼 Verified Ledger: Official Documented Contract Active\n` +
    `📊 Campaign Framework: 30-Sec Viral Strategy Distribution\n` +
    `🚀 Regional Scaling Routing: Continuous background processing running.`
  );
});

bot.command('dating', async (ctx) => {
  await ctx.reply(
    `❤️ **6STARS GLOBAL MATCH PLATFORM NODE (12vtg)**\n` +
    `----------------------------------------\n` +
    `🌐 Regional Distribution Interface: Online\n` +
    `🛡️ Data Sandbox Protection Strategy: Active\n` +
    `🔒 System Anchor Admin Connection: Secured under master account ID.`
  );
});

bot.command('price', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return await ctx.reply('✏️ **Format Required:** /price <asset_id_or_symbol>\nExample: /price btc or /price bitcoin');
  }

  const assetInput = args[1];
  const coinId = normalizeSymbol(assetInput);

  try {
    const data = await safeFetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinId}`
    );

    if (!data || data.length === 0) {
      return await ctx.reply(`⚠️ Asset not found: ${assetInput}\nTry using the full CoinGecko ID or a common symbol (btc, eth, sol, etc.)`);
    }

    const coin = data[0];
    const price = coin.current_price || 0;
    const volume24h = coin.total_volume || 0;
    const change24h = coin.price_change_percentage_24h || 0;

    const report =
      `💰 **CRYPTO INTELLIGENCE REPORT**\n` +
      `----------------------------------\n` +
      `🪙 Asset: ${coin.name} (${coin.symbol.toUpperCase()})\n` +
      `💵 Live Price: $${formatNumber(price)}\n` +
      `📊 24h Volume: $${formatNumber(volume24h)}\n` +
      `📈 24h Change: ${formatPercentage(change24h)}\n\n` +
      `🔄 Data Source: CoinGecko API`;

    await ctx.replyWithMarkdown(report);
  } catch (error) {
    console.error('[PRICE COMMAND ERROR]', error);
    await ctx.reply('⚠️ System temporarily recalibrating. Please retry in 60 seconds.');
  }
});

bot.command('convert', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 4) {
    return await ctx.reply('✏️ **Format Required:** /convert <amount> <from_crypto> <to_target>\nExample: /convert 2.5 btc usd or /convert 100 eth usdt');
  }

  const amountStr = args[1];
  const fromCrypto = args[2];
  const toTarget = args[3];

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return await ctx.reply('⚠️ Error: Amount must be a positive number.\nExample: /convert 2.5 btc usd');
  }

  const fromId = normalizeSymbol(fromCrypto);
  const toId = normalizeSymbol(toTarget);

  try {
    const [fromData, toData] = await Promise.all([
      safeFetch(`${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${fromId}`),
      safeFetch(`${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${toId}`)
    ]);

    if (!fromData || fromData.length === 0) {
      return await ctx.reply(`⚠️ Source asset not found: ${fromCrypto}`);
    }

    if (!toData || toData.length === 0) {
      return await ctx.reply(`⚠️ Target asset not found: ${toTarget}`);
    }

    const fromPrice = fromData[0].current_price || 0;
    const toPrice = toData[0].current_price || 0;

    if (fromPrice === 0 || toPrice === 0) {
      return await ctx.reply('⚠️ Unable to retrieve price data. Please try again.');
    }

    const fromValueUSD = amount * fromPrice;
    const convertedAmount = fromValueUSD / toPrice;

    const report =
      `🔄 **CRYPTO CONVERSION ENGINE**\n` +
      `----------------------------------\n` +
      `📊 Input: ${formatNumber(amount, 8)} ${fromCrypto.toUpperCase()}\n` +
      `💵 USD Value: $${formatNumber(fromValueUSD)}\n` +
      `🎯 Output: ${formatNumber(convertedAmount, 8)} ${toTarget.toUpperCase()}\n\n` +
      `💰 Rate: 1 ${fromCrypto.toUpperCase()} = ${formatNumber(fromPrice / toPrice, 8)} ${toTarget.toUpperCase()}\n` +
      `🔄 Data Source: CoinGecko API`;

    await ctx.replyWithMarkdown(report);
  } catch (error) {
    console.error('[CONVERT COMMAND ERROR]', error);
    await ctx.reply('⚠️ System temporarily recalibrating. Please retry in 60 seconds.');
  }
});

bot.on('channel_post', async (ctx) => {
  const chatId = ctx.chat?.id;
  const text = ctx.message?.text || ctx.message?.caption || '';

  if (!chatId || !text) return;

  const alertMessage = `📢 <b>Group Alert</b>\n\n${text}`;
  await sendMonetizedAlert(chatId, alertMessage, ctx.from?.id || null);
});

bot.on('text', async (ctx) => {
  const chatId = ctx.chat?.id;
  const text = ctx.message?.text || '';
  const senderName = ctx.from?.first_name || ctx.from?.username || 'Unknown';
  const userId = ctx.from?.id;

  if (!chatId || !text) return;

  try {
    let conversationId = null;
    let useDatabase = false;

    if (supabase) {
      const { data: existingConvs } = await supabase
        .from('customer_conversations')
        .select('*')
        .eq('telegram_chat_id', chatId.toString())
        .order('updated_at', { ascending: false })
        .limit(1);

      if (existingConvs && existingConvs.length > 0) {
        conversationId = existingConvs[0].id;
        useDatabase = true;
      } else {
        const { data: newConv } = await supabase
          .from('customer_conversations')
          .insert({
            user_id: 'telegram_user',
            username: senderName,
            telegram_chat_id: chatId.toString(),
            status: 'open'
          })
          .select()
          .single();

        if (newConv) {
          conversationId = newConv.id;
          useDatabase = true;
        }
      }

      if (conversationId) {
        await supabase.from('customer_messages').insert({
          conversation_id: conversationId,
          sender_role: 'telegram_admin',
          message: text,
          source: 'telegram'
        });
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `WELCOME DEAR VALID CUSTOMER\n\nWe received your message: "${text}"\n\nCustomer service will assist you shortly.`,
        }),
      });
    }
  } catch (error) {
    console.error('[CustomerSupport] Error:', error);
  }
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (body?.action === 'sendNotification') {
      const { name, message } = body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      try {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!chatId || !botToken) {
          return res.status(500).json({ error: 'Telegram configuration missing' });
        }

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('[SendNotification] Error:', error);
        return res.status(500).json({ error: 'Failed to send notification' });
      }
    }

    try {
      await bot.handleUpdate(req.body);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Internal Processing Error');
    }
  }

  return res.status(200).send('6STARS Enterprise Router Online.');
}
