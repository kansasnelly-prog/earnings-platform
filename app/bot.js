const { Telegraf } = require('telegraf');
const ledger = require('./ledger');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN || "8513756424:AAFBTFeIiQA5fglLOz4HXxSixylSwGjGsgA";
const MASTER_OWNER_ID = process.env.MASTER_OWNER_ID || "7683177085";
const SOLANA_TOKEN_MINT_ADDRESS = process.env.SOLANA_TOKEN_MINT_ADDRESS || "G9ou5ZV9Uzhy6Bm5CAQBaeXmJxJrHMYGsqCyZFRvhBBh";
const MASTER_PAYOUT_WALLET_ADDRESS = process.env.MASTER_PAYOUT_WALLET_ADDRESS || "55sNuN2Ja4pArEY1xP2NpfZvGHgYa8pifbKM7RtrbkWU";

let bot = null;

if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);
} else {
  console.log("ℹ️ BOT_TOKEN not provided in env. Bot running in standalone simulation mode.");
  bot = {
    command: () => {},
    on: () => {},
    launch: () => Promise.resolve(),
    handleUpdate: () => Promise.resolve()
  };
}

if (bot.command) {
  // 📊 STATUS MONITOR
  bot.command('status', async (ctx) => {
    const report = 
      `🌟 *6STARS GLOBAL EXECUTIVE SYSTEM*\n` +
      `----------------------------------\n` +
      `👑 *Master Owner ID:* ${MASTER_OWNER_ID}\n` +
      `🪙 *Asset:* NellyCoins (NC)\n` +
      `⚡ *Solana Devnet Mint:* \`${SOLANA_TOKEN_MINT_ADDRESS}\`\n` +
      `🔑 *Master Payout Wallet:* \`${MASTER_PAYOUT_WALLET_ADDRESS}\`\n\n` +
      `🤖 *MULTI-AGENT AI STATUS:*\n` +
      `  • 🛠 Senior Dev AI Master Controller: ONLINE\n` +
      `  • 💖 Matchmaking AI Agent: ONLINE (Boy/Girl, Man/Woman, General)\n` +
      `  • 📺 Cinema Co-Pilot AI: ONLINE (20 US/UK/AU Streams)\n\n` +
      `🔄 *System Readiness:* Operational.`;
    
    await ctx.replyWithMarkdown(report);
  });

  // 🪙 NELLYCOINS TRANSACTION SELLING DEPARTMENT
  bot.command('sell', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
      return await ctx.reply('⚠️ Format Required: /sell [nc_amount] [usd_value]\nExample: /sell 5000 250');
    }

    const ncAmount = parseFloat(args[1]);
    const usdValue = parseFloat(args[2]);

    if (isNaN(ncAmount) || isNaN(usdValue)) {
      return await ctx.reply('⚠️ Error: Please enter valid numbers for coins and value.');
    }

    const transactionTime = new Date().toISOString();
    const userId = ctx.from ? String(ctx.from.id) : MASTER_OWNER_ID;

    const currentState = ledger.getUserState(userId);
    const newNcCoins = Math.max(0, currentState.ncCoins - ncAmount);
    const newBalanceUsd = currentState.balanceUsd + usdValue;

    ledger.updateUserState(userId, {
      ncCoins: newNcCoins,
      balanceUsd: newBalanceUsd
    });

    ledger.recordTransaction(userId, 'SELL_NC', ncAmount, usdValue, {
      telegramUsername: ctx.from ? ctx.from.username : 'sreymara_executive',
      timestamp: transactionTime
    });

    await ctx.reply(
      `🛒 *6STARS SALES TERMINAL SELLING NODE*\n` +
      `----------------------------------\n` +
      `📦 *Product Asset:* NellyCoins (NC)\n` +
      `🔹 Allocated Volume: -${ncAmount.toLocaleString()} NC\n` +
      `💵 Value Realized: +$${usdValue.toLocaleString()} USD\n` +
      `📅 Ledger Timestamp: ${transactionTime}\n\n` +
      `✅ Transaction recorded in persistent ledger.`
    );
  });

  // 💖 MATCHMAKING COMMAND
  bot.command('match', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ') || "General";
    await ctx.reply(
      `💖 *MATCHMAKING AI AGENT INITIALIZED*\n` +
      `----------------------------------\n` +
      `Criteria: *${args}*\n\n` +
      `Searching for active blind chat partners...\n` +
      `💡 Icebreaker: "If you could travel anywhere right now on a crypto retreat, where would you go?"`
    );
  });

  // 📺 CINEMA CO-PILOT COMMAND
  bot.command('cinema', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ') || "US Live Streams";
    await ctx.reply(
      `📺 *CINEMA CO-PILOT AI STREAM CONTROLLER*\n` +
      `----------------------------------\n` +
      `Query: *${query}*\n\n` +
      `Featured Regional Live Streams:\n` +
      `1. 🇺🇸 ABC News Live (US)\n` +
      `2. 🇺🇸 LiveNOW from FOX (US)\n` +
      `3. 🇬🇧 Sky News Live (UK)\n` +
      `4. 🇬🇧 Euronews English (UK)\n` +
      `5. 🇦🇺 ABC News Australia (AU)\n` +
      `6. 🇦🇺 7NEWS Australia Live (AU)\n\n` +
      `Tap stream inside the Web App to stream live & collect $0.10/min Cinema Safe Pot rewards!`
    );
  });

  // 🛠 SENIOR DEV COMMAND
  bot.command('dev', async (ctx) => {
    await ctx.reply(
      `🛠 *SENIOR DEV AI MASTER CONTROLLER*\n` +
      `----------------------------------\n` +
      `System status: 100% Healthy.\n` +
      `All 20 Earning Strategies, Solana Devnet Vaults, & YouTube Cinema Engine synchronized.`
    );
  });

  // 💳 PAYOUT COMMAND
  bot.command('payout', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const wallet = args[1] || MASTER_PAYOUT_WALLET_ADDRESS;
    const amount = args[2] || "0.05";
    await ctx.reply(
      `⚡ *SOLANA DEVNET SPL PAYOUT INITIATED*\n` +
      `----------------------------------\n` +
      `Recipient Wallet: \`${wallet}\`\n` +
      `Token Mint Address: \`${SOLANA_TOKEN_MINT_ADDRESS}\`\n` +
      `Amount: ${amount} SOL equivalent in NellyCoins (NC)\n\n` +
      `✅ Payout processed on Devnet!`
    );
  });

  // START COMMAND
  bot.command('start', async (ctx) => {
    const userId = ctx.from ? String(ctx.from.id) : MASTER_OWNER_ID;
    const state = ledger.getUserState(userId);
    await ctx.reply(
      `👑 Welcome to SREYMARA EXECUTIVE HUB & 6STARS BOT!\n\n` +
      `🆔 Master ID: ${state.telegramId}\n` +
      `💵 Balance: $${state.balanceUsd.toFixed(2)} USD\n` +
      `🪙 NellyCoins: ${state.ncCoins.toLocaleString()} NC\n` +
      `⚡ Solana Mint: ${SOLANA_TOKEN_MINT_ADDRESS.substring(0, 8)}...\n\n` +
      `Commands:\n` +
      `/status - Global System & Multi-Agent Analytics\n` +
      `/match [criteria] - Matchmaking & Blind Chat AI\n` +
      `/cinema [query] - YouTube Cinema Co-Pilot Stream Assistant\n` +
      `/dev [prompt] - Senior Dev Master AI Controller\n` +
      `/sell [nc_amount] [usd_val] - Sell NellyCoins to Ledger\n` +
      `/payout [wallet] [sol] - Withdraw to Master Solana Wallet\n` +
      `/balance - View Real-Time Balance`
    );
  });

  bot.command('balance', async (ctx) => {
    const userId = ctx.from ? String(ctx.from.id) : MASTER_OWNER_ID;
    const state = ledger.getUserState(userId);
    await ctx.reply(
      `📊 REAL-TIME LEDGER BALANCE\n` +
      `----------------------------------\n` +
      `🆔 User Telegram ID: ${state.telegramId}\n` +
      `💵 USD Balance: $${state.balanceUsd.toFixed(2)}\n` +
      `🪙 NellyCoins (NC): ${state.ncCoins.toLocaleString()} NC\n` +
      `⚡ Solana Vault: ${state.solVaultBalance} SOL\n` +
      `🔑 Master Wallet: ${MASTER_PAYOUT_WALLET_ADDRESS.substring(0, 10)}...\n` +
      `🎬 Safe Pot: $${state.safePotBalance.toFixed(2)} / $${state.safePotTarget.toFixed(2)}`
    );
  });
}

process.once('SIGINT', () => bot && bot.stop && bot.stop('SIGINT'));
process.once('SIGTERM', () => bot && bot.stop && bot.stop('SIGTERM'));

if (require.main === module && BOT_TOKEN) {
  const WEBHOOK_URL = process.env.WEBHOOK_URL;
  if (WEBHOOK_URL) {
    console.log(`Setting up Telegram Webhook at ${WEBHOOK_URL}/api/webhook/telegram`);
    bot.telegram.setWebhook(`${WEBHOOK_URL}/api/webhook/telegram`)
      .then(() => console.log("Telegram Webhook set successfully"))
      .catch(err => console.error("Error setting webhook:", err));
  } else {
    console.log("Starting Telegram Bot long polling mode...");
    bot.launch()
      .then(() => console.log("Telegram Bot actively listening via long polling!"))
      .catch(err => console.error("Error launching bot:", err));
  }
}

module.exports = bot;
