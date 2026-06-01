// Server-side API route for generating AI-powered customer support suggestions
// This file mirrors generate-ai-suggestions.js but is named to match the
// frontend endpoint /api/generate_of_suggestions.
// It includes admin bypass and robust error handling.

module.exports = async function handler(req, res) {
  console.log('[AI Suggestions] API route hit');
  console.log('[AI Suggestions] method:', req.method);
  console.log('[AI Suggestions] body:', JSON.stringify(req.body));
  console.log('[AI Suggestions] env key exists:', !!process.env.GEMINI_API_KEY);

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[AI Suggestions] CORS preflight request');
    return res.status(200).json({ success: true });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('[AI Suggestions] Invalid method:', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('[AI Suggestions] Parsing request body...');
    const { message, conversationHistory, account_type } = req.body || {};
    const isAdmin = account_type === 'admin';
    if (isAdmin) {
      console.log('[AI Suggestions] Admin request detected, skipping credit checks');
    }
    if (!message) {
      console.log('[AI Suggestions] Missing message field');
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    console.log('[AI Suggestions] Message received, length:', message.length);

    // Import and initialize Gemini client inside handler to catch startup errors
    console.log('[AI Suggestions] Loading Gemini SDK...');
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const openRouterModel = 'google/gemini-pro';
    if (!openRouterApiKey) {
      console.error('[AI Suggestions] CRITICAL: OPENROUTER_API_KEY missing');
      return res.status(500).json({ success: false, error: 'Missing OPENROUTER_API_KEY environment variable' });
    }
    console.log('[AI Suggestions] OpenRouter API key exists.');

    // Build conversation context
    let context = '';
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('[AI Suggestions] Processing conversation history, count:', conversationHistory.length);
      try {
        const recentMessages = conversationHistory.slice(-5).map(msg => {
          const role = msg.sender === 'customer' ? 'Customer' : 'Support';
          return `${role}: ${msg.message}`;
        }).join('\n');
        context = `\n\nRECENT CONVERSATION HISTORY:\n${recentMessages}`;
      } catch (contextError) {
        console.error('[AI Suggestions] Error processing conversation history:', contextError);
        context = '';
      }
    }

    const systemPrompt = `You are an advanced, expert-level AI Customer Support Engineer for the platform 'TASKS REWARD'. \n\nBUSINESS CONTEXT & OPERATIONAL RULES:\n- PLATFORM NAME: TASKS REWARD (also known as TASK REWARD HUB)\n- CORE FUNCTION: We help merchants improve product visibility to the audience/public for products that have low sales. Users recognize, click, and submit these products to boost their visibility.\n- EARNING MECHANISM: Companies and merchants pay us for the product submissions rendered, and users earn rewards for completing these tasks.\n- MAIN ACCOUNT RULE: Users must complete their first set of 35/35 tasks. Once finished, they MUST contact Customer Service to request a manual account reset before they can continue earning.\n- TRAINING ACCOUNT RULE: Users in the training account must complete their first set of 45/45 tasks. Once finished, they MUST contact Customer Service to request a training account reset.\n\nINSTRUCTION ON PROCESSING USER QUERIES:\n1. Deeply analyze the customer's incoming message against the operational rules above.\n2. If a customer states they have completed 35/35 tasks or 45/45 tasks, recognize that they are eligible for an account reset and provide clear guidance on the next steps.\n3. If they ask about how the app works, explain the merchant visibility and product submission model clearly.\n4. Generate exactly 5 distinct variations according to these strict tones:\n   - PROFESSIONAL: Polished, authoritative, structured, and highly capable.\n   - EMPATHETIC: Understanding, supportive, human-centric, yet deeply helpful and solution-oriented.\n   - SHORT: Crisp, direct to the point, answering the core question instantly.\n   - DETAILED: A comprehensive, step-by-step breakdown or deep explanation of the solution.\n   - TECHNICAL: Analytical, precise, focusing on task counts (35/35 or 45/45), system mechanics, or reset troubleshooting steps.\n\nCRITICAL FORMATTING RULE: Return the final text for all 5 suggestions entirely in CAPITAL LETTERS (UPPERCASE).`;

    const userPrompt = `CUSTOMER MESSAGE: ${message}${context}\n\nGenerate 5 distinct response variations (PROFESSIONAL, EMPATHETIC, SHORT, DETAILED, TECHNICAL) for this customer inquiry. Return each suggestion as a separate line in the following JSON format:\n{\n  "suggestions": [\n    {"type": "PROFESSIONAL", "content": "RESPONSE_TEXT"},\n    {"type": "EMPATHETIC", "content": "RESPONSE_TEXT"},\n    {"type": "SHORT", "content": "RESPONSE_TEXT"},\n    {"type": "DETAILED", "content": "RESPONSE_TEXT"},\n    {"type": "TECHNICAL", "content": "RESPONSE_TEXT"}\n  ]\n}`;

    console.log('[AI Suggestions] Calling OpenRouter API...');
    const startTime = Date.now();
    let aiResponse;
    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 1500,
        }),
      });
      const responseTime = Date.now() - startTime;
      console.log('[AI Suggestions] OpenRouter API response received in', responseTime, 'ms');
      if (!openRouterResponse.ok) {
        const errorData = await openRouterResponse.json();
        console.error('[AI Suggestions] OpenRouter API error:', openRouterResponse.status, errorData);
        return res.status(openRouterResponse.status).json({ success: false, error: 'OpenRouter API error', details: errorData?.message || 'Unknown OpenRouter API error' });
      }
      const data = await openRouterResponse.json();
      aiResponse = data?.choices?.[0]?.message?.content;
      if (!aiResponse) {
        console.error('[AI Suggestions] OpenRouter response is empty or invalid');
        return res.status(500).json({ success: false, error: 'AI returned empty response' });
      }
      console.log('[AI Suggestions] AI response received, length:', aiResponse.length);
    } catch (openRouterError) {
      const responseTime = Date.now() - startTime;
      console.error('[AI Suggestions] OpenRouter API error after', responseTime, 'ms:', openRouterError);
      return res.status(503).json({ success: false, error: 'AI service error', details: openRouterError?.message || 'Unknown OpenRouter API error' });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log('[AI Suggestions] AI response JSON parsed successfully');
    } catch (parseError) {
      console.error('[AI Suggestions] Failed to parse AI response as JSON:', parseError, 'raw response:', aiResponse.substring(0, 200));
      return res.status(500).json({ success: false, error: 'Failed to parse AI response' });
    }
    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
      console.error('[AI Suggestions] Invalid response structure, missing suggestions array:', parsedResponse);
      return res.status(500).json({ success: false, error: 'Invalid response format from AI' });
    }
    console.log('[AI Suggestions] Suggestions array found, count:', parsedResponse.suggestions.length);
    let uppercaseSuggestions;
    try {
      uppercaseSuggestions = parsedResponse.suggestions.map(suggestion => {
        if (!suggestion || !suggestion.content) {
          console.error('[AI Suggestions] Invalid suggestion item:', suggestion);
          throw new Error('Invalid suggestion format');
        }
        return { type: suggestion.type || 'UNKNOWN', content: String(suggestion.content).toUpperCase() };
      });
      console.log('[AI Suggestions] All suggestions converted to uppercase');
    } catch (mapError) {
      console.error('[AI Suggestions] Error processing suggestions:', mapError);
      return res.status(500).json({ success: false, error: 'Failed to process suggestions' });
    }
    console.log('[AI Suggestions] Successfully generated', uppercaseSuggestions.length, 'suggestions');
    return res.status(200).json({ success: true, suggestions: uppercaseSuggestions });
  } catch (error) {
    console.error('[AI Suggestions] FULL API ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal server error', details: error?.message || 'Unknown error' });
  }
};