export type PayoutEmailPayload = {
  to: string;
  txHash: string;
  watchBalanceRedeemed: number;
  platformFee: number;
  netPayoutSol: number;
  userWalletAddress: string;
  masterWalletAddress: string;
};

export async function sendPayoutConfirmationEmail(payload: PayoutEmailPayload): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@earnings.ink';

    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY is not configured. Skipping payout confirmation email.');
      return false;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #0d0f12; color: #ffffff; padding: 20px; }
    .card { background-color: #1a1d24; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; border: 1px solid #2e3440; }
    .header { font-size: 20px; font-weight: bold; color: #00ffa3; text-align: center; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .label { color: #8f9aae; }
    .value { font-weight: bold; color: #ffffff; word-break: break-all; }
    .btn { display: block; width: 100%; text-align: center; background-color: #00ffa3; color: #000000; font-weight: bold; padding: 12px 0; border-radius: 8px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">🎉 Solana Payout Confirmed!</div>
    <p>Your Watch-to-Earn exchange on <strong>Nelly TV</strong> has been successfully processed on the Solana blockchain.</p>
    <hr style="border-color: #2e3440; margin: 20px 0;">
    
    <div class="row"><span class="label">Total Redeemed:</span> <span class="value">${payload.watchBalanceRedeemed} PTS</span></div>
    <div class="row"><span class="label">Platform Fee (80%):</span> <span class="value">${payload.platformFee} PTS</span></div>
    <div class="row"><span class="label">Net Payout (20%):</span> <span class="value">${payload.netPayoutSol.toFixed(6)} SOL</span></div>
    <div class="row"><span class="label">Destination Wallet:</span> <span class="value">${payload.userWalletAddress}</span></div>
    
    <a href="https://solscan.io/tx/${payload.txHash}" class="btn" target="_blank">View Transaction on Solscan</a>
  </div>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: payload.to,
        subject: '🎉 Solana Payout Confirmed - Nelly TV',
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Email] Failed to send payout confirmation:', text);
      return false;
    }

    console.log('[Email] Payout confirmation sent to:', payload.to);
    return true;
  } catch (error) {
    console.error('[Email] Exception sending payout confirmation:', error);
    return false;
  }
}
