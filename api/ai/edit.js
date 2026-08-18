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
    const { action, engine, input } = body;

    if (!input || !input.trim()) {
      return sendResponse(res, 400, { output: 'Missing input text.' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

    if (!GEMINI_API_KEY) {
      return sendResponse(res, 200, {
        output: `[${action.toUpperCase()}] ${engine} processed: ${input.trim().slice(0, 120)}${input.trim().length > 120 ? '...' : ''}`,
        simulated: true,
      });
    }

    const prompts: Record<string, string> = {
      translate: 'Translate the following text to English, preserving formatting:\n\n',
      style: `Rewrite the following text in a ${engine} style, preserving formatting:\n\n`,
      fix: 'Fix grammar, spelling, and clarity in the following text, preserving formatting:\n\n',
      gemini: 'Improve and enhance the following text, preserving formatting:\n\n',
    };

    const prompt = (prompts[action] || '') + input.trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[AI/Edit] Gemini error:', response.status, text);
      return sendResponse(res, 200, {
        output: `[${action.toUpperCase()}] Service temporarily unavailable.`,
        simulated: true,
      });
    }

    const data = await response.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No output.';

    return sendResponse(res, 200, {
      output,
      action,
      engine,
      simulated: false,
    });
  } catch (error) {
    console.error('[AI/Edit] Handler error:', error);
    return sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}

export default handler;
