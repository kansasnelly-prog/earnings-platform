import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendResponse, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STRATEGY_HANDLERS = {
  'watch-to-earn': async (userId) => ({ status: 'SUCCESS_VERIFIED', baseReward: 0.05, currency: 'USDT', message: 'Video ad reward credited.' }),
  'telegram-stars': async (userId) => ({ status: 'INVOICE_READY', baseReward: 10, currency: 'XTR', message: 'Star invoice prepared.' }),
  'ton-deposit-bonus': async (userId) => ({ status: 'BONUS_APPLIED', baseReward: 1, currency: 'TON', message: 'TON deposit bonus applied.' }),
  'solana-staking': async (userId) => ({ status: 'STAKING_ACTIVE', baseReward: 0.01, currency: 'SOL', message: 'Staking position opened.' }),
  'adsgram-rewarded-video': async (userId) => ({ status: 'SUCCESS_VERIFIED', baseReward: 0.005, currency: 'USDT', message: 'Adsgram reward credited.' }),
  'referral-commission': async (userId) => ({ status: 'COMMISSION_LOGGED', baseReward: 1, currency: 'USDT', message: 'Referral commission recorded.' }),
  'daily-checkin': async (userId) => ({ status: 'CLAIMED', baseReward: 0.01, currency: 'USDT', message: 'Daily check-in claimed.' }),
  'task-completion': async (userId) => ({ status: 'REWARDED', baseReward: 0.25, currency: 'USDT', message: 'Task reward credited.' }),
  'training-account-bonus': async (userId) => ({ status: 'BONUS_APPLIED', baseReward: 5, currency: 'USDT', message: 'Training bonus credited.' }),
  'vip-level-bonus': async (userId) => ({ status: 'BONUS_APPLIED', baseReward: 2, currency: 'USDT', message: 'VIP bonus credited.' }),
  'executive-vault-yield': async (userId) => ({ status: 'YIELD_DISTRIBUTED', baseReward: 0.5, currency: 'USDT', message: 'Vault yield distributed.' }),
  'cinema-stream-reward': async (userId) => ({ status: 'REWARDED', baseReward: 0.02, currency: 'USDT', message: 'Stream reward credited.' }),
  'ai-chat-engagement': async (userId) => ({ status: 'REWARDED', baseReward: 0.03, currency: 'USDT', message: 'AI engagement reward credited.' }),
  'social-share-bonus': async (userId) => ({ status: 'REWARDED', baseReward: 0.02, currency: 'USDT', message: 'Share bonus credited.' }),
  'matchmaking-reward': async (userId) => ({ status: 'REWARDED', baseReward: 0.1, currency: 'USDT', message: 'Matchmaking reward credited.' }),
  'product-catalog-commission': async (userId) => ({ status: 'COMMISSION_LOGGED', baseReward: 0.5, currency: 'USDT', message: 'Catalog commission recorded.' }),
  'ad-impression-revenue': async (userId) => ({ status: 'REVENUE_LOGGED', baseReward: 0.0001, currency: 'USDT', message: 'Ad revenue share recorded.' }),
  'multi-chain-yield': async (userId) => ({ status: 'YIELD_DISTRIBUTED', baseReward: 0.2, currency: 'USDT', message: 'Multi-chain yield distributed.' }),
  'mini-app-engagement': async (userId) => ({ status: 'REWARDED', baseReward: 0.015, currency: 'USDT', message: 'Mini-app engagement reward credited.' }),
  'executive-membership': async (userId) => ({ status: 'REWARDED', baseReward: 1, currency: 'USDT', message: 'Executive membership reward credited.' }),
  'us-premium-ads': async (userId) => ({ status: 'REWARDED', baseReward: 0.25, currency: 'USDT', message: 'US premium ad inventory reward credited.' }),
  'ca-streaming-bonus': async (userId) => ({ status: 'REWARDED', baseReward: 0.18, currency: 'USDT', message: 'Canada streaming bonus credited.' }),
  'uk-media-yield': async (userId) => ({ status: 'REWARDED', baseReward: 0.22, currency: 'USDT', message: 'UK media yield pool reward credited.' }),
  'global-executive-revenue': async (userId) => ({ status: 'YIELD_DISTRIBUTED', baseReward: 0.35, currency: 'USDT', message: 'Global executive revenue share distributed.' }),
  'google-2nd-gen-monetization': async (userId) => ({ status: 'REWARDED', baseReward: 0.30, currency: 'USDT', message: 'Google 2nd gen monetization reward credited.' }),
  'ai-enhanced-cpm': async (userId) => ({ status: 'REWARDED', baseReward: 0.20, currency: 'USDT', message: 'AI-enhanced CPM optimization reward credited.' }),
  'premium-sponsorship': async (userId) => ({ status: 'REWARDED', baseReward: 2.5, currency: 'USDT', message: 'Premium sponsorship reward credited.' }),
  'youtube-content-monetization': async (userId) => ({ status: 'REWARDED', baseReward: 0.15, currency: 'USDT', message: 'YouTube content monetization reward credited.' }),
  'telegram-mini-app-ads': async (userId) => ({ status: 'REWARDED', baseReward: 0.08, currency: 'USDT', message: 'Telegram Mini App ads reward credited.' }),
  'solana-yield-farming': async (userId) => ({ status: 'STAKING_ACTIVE', baseReward: 0.02, currency: 'SOL', message: 'Solana yield farming reward credited.' }),
  'usdt-liquidity-mining': async (userId) => ({ status: 'YIELD_DISTRIBUTED', baseReward: 0.12, currency: 'USDT', message: 'USDT liquidity mining reward credited.' }),
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
    const { strategySlug, userId } = body;

    if (!strategySlug || !userId) {
      sendResponse(res, 400, { success: false, message: 'Missing strategySlug or userId' });
      return;
    }

    const handlerFn = STRATEGY_HANDLERS[strategySlug];
    if (!handlerFn) {
      sendResponse(res, 404, { success: false, message: 'Unknown strategy' });
      return;
    }

    const result = await handlerFn(userId, body);
    const multipliedReward = (result.baseReward || 0) * PROFIT_MULTIPLIER;

    const creditResult = await creditUser(userId, multipliedReward, result.currency || 'USDT', strategySlug, {
      status: result.status,
      message: result.message,
    });

    sendResponse(res, 200, {
      success: true,
      strategy: strategySlug,
      masterWallet: MASTER_WALLET,
      baseReward: result.baseReward,
      multipliedReward,
      currency: result.currency,
      status: result.status,
      message: result.message,
      creditResult,
    });
  } catch (error) {
    console.error('[Earnings] Handler error:', error);
    sendResponse(res, 500, { success: false, message: error.message || 'Internal server error' });
  }
}

export default handler;
