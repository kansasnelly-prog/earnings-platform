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

const AD_YIELD_RATES = {
  MONETAG_SMARTLINK: 0.00020,
  HILLTOP_DIRECT_LINK: 0.00015,
  ADSTERRA_NATIVE: 0.00010,
  ADSENSE_DISPLAY: 0.00005,
  COINZILLA_WEB3: 0.00025,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

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
    const { userWalletAddress, adEngine, eventType } = body;

    if (!userWalletAddress) {
      return sendResponse(res, 400, { error: 'Missing bound master wallet address.' });
    }

    const rewardAmount = AD_YIELD_RATES[adEngine] || 0.00010;

    console.log('[AdsTelemetry] Event logged:', {
      userWalletAddress,
      adEngine,
      eventType,
      rewardAmount,
      timestamp: new Date().toISOString(),
    });

    return sendResponse(res, 200, {
      status: 'SUCCESS_AD_VERIFIED',
      engine: adEngine,
      solReward: rewardAmount,
      txHash: 'logged',
      swapReady: true,
    });
  } catch (error) {
    console.error('[AdsTelemetry] Handler error:', error);
    return sendResponse(res, 500, { status: 'FAILED', error: error.message || 'Internal server error' });
  }
}

export default handler;
