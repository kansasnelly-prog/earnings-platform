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
    const { message, model, history, userId } = body;

    if (!message || !message.trim()) {
      sendResponse(res, 400, { error: 'Missing message' });
      return;
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

    if (!GEMINI_API_KEY) {
      const creditResult = await creditUser(userId, 0.03, 'USDT', 'ai-chat-engagement', {
        messageLength: message.trim().length,
        model: model || 'Flash',
      });

      sendResponse(res, 200, {
        reply: `[${model || 'Flash'}] Simulated response to: "${message.trim()}"`,
        model: model || 'Flash',
        simulated: true,
        creditResult,
      });
      return;
    }

    const contents = (history || [])
      .filter((m) => m.content)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[AI/Chat] Gemini error:', response.status, text);
      const creditResult = await creditUser(userId, 0.03, 'USDT', 'ai-chat-engagement', { error: true, model: model || 'Flash' });
      sendResponse(res, 200, {
        reply: `[${model || 'Flash'}] Service temporarily unavailable.`,
        model: model || 'Flash',
        simulated: true,
        creditResult,
      });
      return;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';

    const creditResult = await creditUser(userId, 0.03, 'USDT', 'ai-chat-engagement', { model: model || 'Flash' });

    sendResponse(res, 200, {
      reply,
      model: model || 'Flash',
      simulated: false,
      creditResult,
    });
  } catch (error) {
    console.error('[AI/Chat] Handler error:', error);
    sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}

export default handler;
