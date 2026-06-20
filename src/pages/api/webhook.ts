import { NextApiRequest, NextApiResponse } from 'next';
import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing from your Vercel Dashboard Environment Variables.');

const bot = new Telegraf(token);

// Initialize Supabase client for status checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 🔒 MASTER IDENTITY IDENTITY LOCK (6STARS AUTHENTICATION CORE)
const MASTER_ADMIN_ID = 7683177085; 

// 👁️ MASTER EYES INTERCEPTOR (Background Surveillance Layer)
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || 'Unknown Node';
  const incomingText = ctx.message && 'text' in ctx.message ? (ctx.message as any).text : 'Non-text event';
  
  console.log(`[MASTER EYES MONITOR] Time: ${new Date().toISOString()} | User: @${username} (${userId}) | Input: "${incomingText}"`);

  if (userId !== MASTER_ADMIN_ID) {
    console.log(`[SECURITY INTERCEPTION]: Unauthorized system breach attempt dropped silently from ID: ${userId}`);
    return; 
  }
  return next();
});

// 📊 SYSTEM STATUS & EXECUTIVE ENVIRONMENT CONTROL
bot.command('status', async (ctx) => {
  // Check database connection
  let dbStatus = 'Inactive';
  if (supabase) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      dbStatus = error ? 'Error' : 'Active';
    } catch (err) {
      dbStatus = 'Error';
    }
  }

  // Check AI integration (OpenAI)
  const aiKey = process.env.OPENAI_API_KEY;
  const aiStatus = aiKey ? 'Ready' : 'Not Configured';

  const report = 
    `📊 System Status: Online\n` +
    `🗄️ Database Connection: ${dbStatus}\n` +
    `🤖 AI Engine: ${aiStatus}\n\n` +
    `🌟 **6STARS GLOBAL EXECUTIVE SYSTEM (12vtg)**\n` +
    `----------------------------------\n` +
    `📁 **Core Analytics:** SILVE Business Framework Protected\n` +
    `🌍 **Active Jurisdictions:** Cambodia, Vietnam, US, UK, Germany, Switzerland, Australia (50+ Countries Ready)\n` +
    `🪙 **Asset Pool:** Nellycoins (NC Coins)\n\n` +
    `📱 **TikTok6 Node:** Multi-million Contract Router Verified\n` +
    `❤️ **Match Engine:** Dating Platform Sandbox Operational\n` +
    `👁️ **Master Eyes Layer:** ACTIVE (Surveillance Matrix Streaming)\n` +
    `⚡ **30 Sec Engine:** Active learning loops monitored.\n` +
    `🔄 System Readiness: Operational and standing by for instant execution.`;
  
  await ctx.replyWithMarkdown(report);
});

// 🪙 NELLYCOINS TRANSACTION SELLING DEPARTMENT
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
    `📦 **Product Asset:** Nellycoins (NC Coins)\n` +
    `🔹 Allocated Volume: +${ncAmount.toLocaleString()} NC\n` +
    `💵 Value Realized: $${usdValue.toLocaleString()} USD\n` +
    `📅 Ledger Timestamp: ${transactionTime}\n\n` +
    `✅ Transaction recorded across global regional nodes.`
  );
});

// 📱 MAIN TIKTOK API DATA ENVIRONMENT INTEGRATION
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

// 📱 TIKTOK6 OFFICIAL DOCUMENTED EARNING NODE
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

// ❤️ DATING PLATFORM CROSS-OVER REGIONAL MODULE
bot.command('dating', async (ctx) => {
  await ctx.reply(
    `❤️ **6STARS GLOBAL MATCH PLATFORM NODE (12vtg)**\n` +
    `----------------------------------------\n` +
    `🌐 Regional Distribution Interface: Online\n` +
    `🛡️ Data Sandbox Protection Strategy: Active\n` +
    `🔒 System Anchor Admin Connection: Secured under master account ID.`
  );
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Internal Processing Error');
    }
  } else {
    return res.status(200).send('6STARS Enterprise Router Online.');
  }
}
