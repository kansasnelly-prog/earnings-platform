const MASTER_SOL_WALLET = process.env.MASTER_SOL_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

export function buildSolanaPayLink(amountSol: number = 0.01, label: string = 'Tip Admin'): string {
  const payload = encodeURIComponent(
    JSON.stringify({
      asset: {
        chain: 'SOL',
        amount: amountSol,
        mint: 'SOL',
      },
      to: MASTER_SOL_WALLET,
      label,
    })
  );

  return `https://phantom.to/tx?${payload}`;
}

export function buildDeepLink(path: string = 'watch'): string {
  const baseUrl = process.env.TELEGRAM_MINI_APP_URL || 'https://earnings-ink.vercel.app';
  return `${baseUrl}?startapp=${path}`;
}

export function buildMonetizedInlineKeyboard(amountSol: number = 0.01) {
  return {
    inline_keyboard: [
      [
        {
          text: `⚡ Tip Admin (${amountSol} SOL)`,
          url: buildSolanaPayLink(amountSol),
        },
        {
          text: '📺 Watch & Earn (App)',
          url: buildDeepLink('watch'),
        },
      ],
    ],
  };
}
