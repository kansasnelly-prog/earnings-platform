const path = require('path');
const fs = require('fs');

const ROUTES = {
  'telegram-alert': './telegram-alert.js',
  'ads/telemetry': './ads/telemetry.js',
  'ai/chat': './ai/chat.js',
  'ai/edit': './ai/edit.js',
  'auth/google-refresh': './auth/google-refresh.js',
  'auth/google': './auth/google.js',
  'cinema/stream-reward': './cinema/stream-reward.js',
  'cron/solana-flush': './cron/solana-flush.js',
  'earnings/execute': './earnings/execute.js',
  'master-wallet/aggregator': './master-wallet/aggregator.js',
  'matchmaking/start': './matchmaking/start.js',
  'solana/flush': './solana/flush.js',
  'solana/verify': './solana/verify.js',
  'watch-to-earn/claim': './watch-to-earn/claim.js',
  'webhooks/adsgram': './webhooks/adsgram.js',
  'webhooks/solana': './webhooks/solana.js',
  'webhooks/telegram-stars': './webhooks/telegram-stars.js',
  'webhooks/ton': './webhooks/ton.js',
  'withdrawals/cinema': './withdrawals/cinema.js',
};

const BASE_DIR = path.join(__dirname, '..', 'vercel-api');

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendResponse(res, 200, { success: true });
    return;
  }

  const pathParts = (req.params && req.params.path) || [];
  const routeKey = pathParts.join('/');

  const handlerPath = ROUTES[routeKey];
  if (!handlerPath) {
    sendResponse(res, 404, { error: 'Not Found', path: routeKey });
    return;
  }

  const fullPath = path.join(BASE_DIR, handlerPath);
  if (!fs.existsSync(fullPath)) {
    sendResponse(res, 404, { error: 'Handler not found', path: fullPath });
    return;
  }

  try {
    const module = await import(fullPath);
    const exported = module.default || module;
    if (typeof exported === 'function') {
      await exported(req, res);
    } else {
      sendResponse(res, 500, { error: 'Invalid handler export' });
    }
  } catch (error) {
    console.error(`[API Gateway] Error handling ${routeKey}:`, error);
    sendResponse(res, 500, { error: 'Internal server error', message: error.message });
  }
}

module.exports = handler;
