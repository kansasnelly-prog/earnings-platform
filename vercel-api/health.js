// Deployment Health Beacon — GET /api/health
// Proves the Vercel serverless layer is live after every deploy and reports
// whether the Cinema (NELLY'S TV) monetization revenue pipeline is configured.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  if (typeof res.writeHead === 'function') {
    res.writeHead(statusCode, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify(data));
  } else if (typeof res.status === 'function') {
    res.status(statusCode).json(data);
  } else if (typeof res.end === 'function') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json');
    }
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  }
}

function isSet(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendResponse(res, 200, { success: true });
    return;
  }

  if (req.method !== 'GET') {
    sendResponse(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    sendResponse(res, 200, {
      status: 'ok',
      service: 'earnings-ink API gateway',
      gateway: 'api/[[...path]].js',
      deployment: {
        env: process.env.VERCEL_ENV || 'local',
        region: process.env.VERCEL_REGION || null,
        commit: isSet(process.env.VERCEL_GIT_COMMIT_SHA)
          ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12)
          : null,
        node: process.version,
      },
      cinemaRevenuePipeline: {
        engine: 'ExecutiveTVPanel (NELLY TV)',
        rewardEndpoint: '/api/cinema/stream-reward',
        withdrawEndpoint: '/api/withdrawals/cinema',
        baseRewardPerTick: 12.5,
        multiplier: 12,
        creditedPerTick: 150,
        tickSeconds: 10,
        microUSDTPerTick: 0.002,
        withdrawUnlockSeconds: 3600,
        supabaseConfigured: isSet(supabaseUrl),
        supabaseServiceKey: isSet(process.env.SUPABASE_SERVICE_ROLE_KEY),
        telegramAlerts: isSet(process.env.TELEGRAM_BOT_TOKEN) && isSet(process.env.TELEGRAM_CHAT_ID),
        solanaWithdrawals: isSet(process.env.SOLANA_ADMIN_PRIVATE_KEY),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // The beacon must never crash: report degraded state instead.
    sendResponse(res, 200, {
      status: 'degraded',
      service: 'earnings-ink API gateway',
      message: error && error.message ? error.message : 'Health check warning',
      timestamp: new Date().toISOString(),
    });
  }
}

export default handler;
