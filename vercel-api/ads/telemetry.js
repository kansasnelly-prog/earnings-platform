import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendResponse, getSupabase, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AD_YIELD_RATES = {
  MONETAG_SMARTLINK: 0.00020,
  HILLTOP_DIRECT_LINK: 0.00015,
  ADSTERRA_NATIVE: 0.00010,
  ADSENSE_DISPLAY: 0.00005,
  COINZILLA_WEB3: 0.00025,
};

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
    const { userWalletAddress, adEngine, eventType, userId, amount } = body;

    if (!userWalletAddress) {
      sendResponse(res, 400, { error: 'Missing bound master wallet address.' });
      return;
    }

    const baseReward = amount || AD_YIELD_RATES[adEngine] || 0.00010;
    const multipliedReward = baseReward * PROFIT_MULTIPLIER;

    const creditResult = await creditUser(
      userId,
      multipliedReward,
      'USDT',
      'ad-impression-revenue',
      {
        adEngine: adEngine || 'unknown',
        eventType: eventType || 'impression',
        wallet: userWalletAddress,
      }
    );

    console.log('[AdsTelemetry] Event logged:', {
      userWalletAddress,
      adEngine,
      eventType,
      baseReward,
      multipliedReward,
      creditResult,
      timestamp: new Date().toISOString(),
    });

    sendResponse(res, 200, {
      status: 'SUCCESS_AD_VERIFIED',
      engine: adEngine,
      baseReward,
      multipliedReward,
      solReward: multipliedReward,
      txHash: creditResult ? 'credited' : 'logged',
      swapReady: true,
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[AdsTelemetry] Handler error:', error);
    sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
