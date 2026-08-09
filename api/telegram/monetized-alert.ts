import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const MASTER_SOLANA_WALLET = process.env.MASTER_SOL_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';
const WEB3_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'https://earnings-ink.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

function createSolanaPaymentLink(amountSol: number, label: string) {
  const dappPaymentUrl = `${WEB3_APP_URL}/pay?recipient=${MASTER_SOLANA_WALLET}&amount=${amountSol}&label=${encodeURIComponent(label)}`;
  const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(dappPaymentUrl)}?ref=${encodeURIComponent(WEB3_APP_URL)}`;
  return { dappPaymentUrl, phantomDeepLink };
}

bot.on('message', async (ctx) => {
  if (ctx.chat.type === 'private') {
    const amount = 0.005;
    const { phantomDeepLink } = createSolanaPaymentLink(amount, 'Direct Chat Fee');

    const responseText =
      `👋 **Thanks for reaching out!**\n\n` +
      `To get a direct response or unlock full communication access, please remit **${amount} SOL** to my Master Wallet.\n\n` +
      `📍 Wallet: \`${MASTER_SOLANA_WALLET}\``;

    await ctx.reply(responseText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url(`⚡ Pay ${amount} SOL via Phantom`, phantomDeepLink)]
      ])
    });
  }
});

export async function sendMonetizedSignalAlert(chatId: string | number, signalSummary: string) {
  const unlockAmount = 0.01;
  const { phantomDeepLink } = createSolanaPaymentLink(unlockAmount, 'VIP Signal Unlock');

  const alertMessage =
    `🚨 **NEW HIGH-CONVICTION SIGNAL DETECTED** 🚨\n\n` +
    `📊 **Asset Preview:** ${signalSummary}\n` +
    `🔒 *Full Entry Target, Stop Loss, and Take Profit targets are locked.*\n\n` +
    `Pay **${unlockAmount} SOL** to unlock full alert execution parameters directly to the Master Wallet.`;

  await bot.telegram.sendMessage(chatId, alertMessage, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url(`🔓 Unlock Full Alert (${unlockAmount} SOL)`, phantomDeepLink)],
      [Markup.button.url(`📈 Trade on Jupiter (Affiliate)`, `https://jup.ag/swap/SOL-USDC?referrer=${MASTER_SOLANA_WALLET}`)]
    ])
  });
}

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).send('Method Not Allowed');
}
