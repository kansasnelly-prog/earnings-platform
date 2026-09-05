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
    sendResponse(res, 200, { success: true });
    return;
  }

  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { engineId, userId } = body;

    if (!engineId) {
      sendResponse(res, 400, { error: 'Missing engineId' });
      return;
    }

    const creditResult = await creditUser(userId, 0.1, 'USDT', 'matchmaking', {
      engineId,
      action: 'start',
    });

    console.log('[Matchmaking] Start request:', {
      engineId,
      userId: userId || 'anonymous',
      creditResult,
      timestamp: new Date().toISOString(),
    });

    sendResponse(res, 200, {
      success: true,
      engineId,
      status: 'searching',
      message: `Matchmaking started for ${engineId}`,
      creditResult,
    });
  } catch (error) {
    console.error('[Matchmaking] Handler error:', error);
    sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}

export default handler;
