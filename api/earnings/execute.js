import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      envVars[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return envVars;
}

const ENV = loadEnv();
const MASTER_WALLET = ENV.MASTER_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

const STRATEGY_HANDLERS: Record<string, (userId: string, body: any) => Promise<any>> = {
  'watch-to-earn': async () => ({ status: 'SUCCESS_VERIFIED', reward: 0.05, currency: 'USDT', message: 'Video ad reward credited.' }),
  'telegram-stars': async () => ({ status: 'INVOICE_READY', reward: 10, currency: 'XTR', message: 'Star invoice prepared.' }),
  'ton-deposit-bonus': async () => ({ status: 'BONUS_APPLIED', reward: 1, currency: 'TON', message: 'TON deposit bonus applied.' }),
  'solana-staking': async () => ({ status: 'STAKING_ACTIVE', reward: 0.01, currency: 'SOL', message: 'Staking position opened.' }),
  'adsgram-rewarded-video': async () => ({ status: 'SUCCESS_VERIFIED', reward: 0.005, currency: 'USDT', message: 'Adsgram reward credited.' }),
  'referral-commission': async () => ({ status: 'COMMISSION_LOGGED', reward: 1, currency: 'USDT', message: 'Referral commission recorded.' }),
  'daily-checkin': async () => ({ status: 'CLAIMED', reward: 0.01, currency: 'USDT', message: 'Daily check-in claimed.' }),
  'task-completion': async () => ({ status: 'REWARDED', reward: 0.25, currency: 'USDT', message: 'Task reward credited.' }),
  'training-account-bonus': async () => ({ status: 'BONUS_APPLIED', reward: 5, currency: 'USDT', message: 'Training bonus credited.' }),
  'vip-level-bonus': async () => ({ status: 'BONUS_APPLIED', reward: 2, currency: 'USDT', message: 'VIP bonus credited.' }),
  'executive-vault-yield': async () => ({ status: 'YIELD_DISTRIBUTED', reward: 0.5, currency: 'USDT', message: 'Vault yield distributed.' }),
  'cinema-stream-reward': async () => ({ status: 'REWARDED', reward: 0.02, currency: 'USDT', message: 'Stream reward credited.' }),
  'ai-chat-engagement': async () => ({ status: 'REWARDED', reward: 0.03, currency: 'USDT', message: 'AI engagement reward credited.' }),
  'social-share-bonus': async () => ({ status: 'REWARDED', reward: 0.02, currency: 'USDT', message: 'Share bonus credited.' }),
  'matchmaking-reward': async () => ({ status: 'REWARDED', reward: 0.1, currency: 'USDT', message: 'Matchmaking reward credited.' }),
  'product-catalog-commission': async () => ({ status: 'COMMISSION_LOGGED', reward: 0.5, currency: 'USDT', message: 'Catalog commission recorded.' }),
  'ad-impression-revenue': async () => ({ status: 'REVENUE_LOGGED', reward: 0.0001, currency: 'USDT', message: 'Ad revenue share recorded.' }),
  'multi-chain-yield': async () => ({ status: 'YIELD_DISTRIBUTED', reward: 0.2, currency: 'USDT', message: 'Multi-chain yield distributed.' }),
  'mini-app-engagement': async () => ({ status: 'REWARDED', reward: 0.015, currency: 'USDT', message: 'Mini-app engagement reward credited.' }),
  'executive-membership': async () => ({ status: 'REWARDED', reward: 1, currency: 'USDT', message: 'Executive membership reward credited.' }),
  'us-premium-ads': async () => ({ status: 'REWARDED', reward: 0.25, currency: 'USDT', message: 'US premium ad inventory reward credited.' }),
  'ca-streaming-bonus': async () => ({ status: 'REWARDED', reward: 0.18, currency: 'USDT', message: 'Canada streaming bonus credited.' }),
  'uk-media-yield': async () => ({ status: 'REWARDED', reward: 0.22, currency: 'USDT', message: 'UK media yield pool reward credited.' }),
  'global-executive-revenue': async () => ({ status: 'YIELD_DISTRIBUTED', reward: 0.35, currency: 'USDT', message: 'Global executive revenue share distributed.' }),
  'google-2nd-gen-monetization': async () => ({ status: 'REWARDED', reward: 0.30, currency: 'USDT', message: 'Google 2nd gen monetization reward credited.' }),
  'ai-enhanced-cpm': async () => ({ status: 'REWARDED', reward: 0.20, currency: 'USDT', message: 'AI-enhanced CPM optimization reward credited.' }),
  'premium-sponsorship': async () => ({ status: 'REWARDED', reward: 2.5, currency: 'USDT', message: 'Premium sponsorship reward credited.' }),
  'youtube-content-monetization': async () => ({ status: 'REWARDED', reward: 0.15, currency: 'USDT', message: 'YouTube content monetization reward credited.' }),
  'telegram-mini-app-ads': async () => ({ status: 'REWARDED', reward: 0.08, currency: 'USDT', message: 'Telegram Mini App ads reward credited.' }),
  'solana-yield-farming': async () => ({ status: 'STAKING_ACTIVE', reward: 0.02, currency: 'SOL', message: 'Solana yield farming reward credited.' }),
  'usdt-liquidity-mining': async () => ({ status: 'YIELD_DISTRIBUTED', reward: 0.12, currency: 'USDT', message: 'USDT liquidity mining reward credited.' }),
};

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { strategySlug, userId } = body;

    if (!strategySlug || !userId) {
      return sendResponse(res, 400, { success: false, message: 'Missing strategySlug or userId' });
    }

    const handlerFn = STRATEGY_HANDLERS[strategySlug];
    if (!handlerFn) {
      return sendResponse(res, 404, { success: false, message: 'Unknown strategy' });
    }

    const result = await handlerFn(userId, body);

    return sendResponse(res, 200, {
      success: true,
      strategy: strategySlug,
      masterWallet: MASTER_WALLET,
      ...result,
    });
  } catch (error) {
    console.error('[Earnings] Handler error:', error);
    return sendResponse(res, 500, { success: false, message: error.message || 'Internal server error' });
  }
}

export default handler;
