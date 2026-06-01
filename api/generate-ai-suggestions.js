// Server-side API route for generating AI-powered customer support suggestions via local Ollama

export default async function handler(req, res) {
  console.log('[AI Suggestions] API route hit (Ollama Mode)');

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory, account_type } = req.body || {};
    // Fallback for raw string body when not parsed by framework
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        console.error('[AI Suggestions] Failed to parse raw body', e);
      }
    }
    // Bypass credit deduction for admin or missing profile
    let isAdmin = false;
    if (!account_type) {
      isAdmin = true;
    }

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    let context = '';
    if (conversationHistory && conversationHistory.length > 0) {
      try {
        const recentMessages = conversationHistory.slice(-4).map(msg => {
          const role = msg.sender === 'customer' ? 'Customer' : 'Support';
          return `${role}: ${msg.message}`;
        }).join('\n');
        context = `\n\nRECENT CONVERSATION HISTORY:\n${recentMessages}`;
      } catch (e) {
        context = '';
      }
    }

    const systemPrompt = `You are an advanced AI Support Engineer for 'TASKS REWARD'.
- MAIN ACCOUNT RULE: Users must complete 35/35 tasks. Then they MUST contact Customer Service for a manual account reset.
- TRAINING ACCOUNT RULE: Users in training must complete 45/45 tasks before requesting a training reset.
Generate exactly 5 distinct response variations in strict JSON formatting.
CRITICAL: All response contents must be entirely in UPPERCASE LETTERS.`;

    const userPrompt = `CUSTOMER MESSAGE: ${message}${context}
Generate 5 response variations in this exact format:
{
  "suggestions": [
    {"type": "PROFESSIONAL", "content": "TEXT"},
    {"type": "EMPATHETIC", "content": "TEXT"},
    {"type": "SHORT", "content": "TEXT"},
    {"type": "DETAILED", "content": "TEXT"},
    {"type": "TECHNICAL", "content": "TEXT"}
  ]
}`;

    // Connect to local Ollama instance running in the background
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let ollamaResponse;
    try {
      ollamaResponse = await fetch('http://127.0.0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: { temperature: 0.6 }
      }),
      signal: controller.signal
    });
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.error('[AI Suggestions] Request timed out after 60s');
        return res.status(504).json({ success: false, error: 'Request timed out' });
      }
      console.error('[AI Suggestions] Fetch error', err);
      return res.status(500).json({ success: false, error: 'Ollama fetch error' });
    }

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return res.status(500).json({ success: false, error: 'Ollama Error', details: errText });
    }

    const data = await ollamaResponse.json();
    const aiResponse = data?.message?.content;

    try {
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return res.status(200).json(JSON.parse(aiResponse.substring(jsonStart, jsonEnd)));
      }
      return res.status(200).json({ text: aiResponse });
    } catch (parseError) {
      return res.status(200).json({ text: aiResponse });
    }

  } catch (globalError) {
    return res.status(500).json({ success: false, error: 'Internal server exception' });
  }
}
