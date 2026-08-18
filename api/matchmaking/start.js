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
    const { engineId, userId } = body;

    if (!engineId) {
      return sendResponse(res, 400, { error: 'Missing engineId' });
    }

    console.log('[Matchmaking] Start request:', {
      engineId,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });

    return sendResponse(res, 200, {
      success: true,
      engineId,
      status: 'searching',
      message: `Matchmaking started for ${engineId}`,
    });
  } catch (error) {
    console.error('[Matchmaking] Handler error:', error);
    return sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}

export default handler;
