// Server-side API route for generating AI-powered customer support suggestions
// Integrates with OpenAI API for intelligent, context-aware response generation

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // CRITICAL: Always set JSON content type header
  res.setHeader('Content-Type', 'application/json');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Get environment variables
    const env = req?.env || process.env;
    const openaiApiKey = env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.error('[AI Suggestions] OPENAI_API_KEY not configured');
      return res.status(500).json({ success: false, error: 'AI service not configured' });
    }

    // Build conversation context
    let context = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-5).map(msg => {
        const role = msg.sender === 'customer' ? 'Customer' : 'Support';
        return `${role}: ${msg.message}`;
      }).join('\n');
      context = `\n\nRECENT CONVERSATION HISTORY:\n${recentMessages}`;
    }

    // Super Pro AI System Prompt with Tasks Reward Hub business rules
    const systemPrompt = `You are an advanced, expert-level AI Customer Support Engineer for the platform 'TASKS REWARD'. 

BUSINESS CONTEXT & OPERATIONAL RULES:
- PLATFORM NAME: TASKS REWARD (also known as TASK REWARD HUB)
- CORE FUNCTION: We help merchants improve product visibility to the audience/public for products that have low sales. Users recognize, click, and submit these products to boost their visibility.
- EARNING MECHANISM: Companies and merchants pay us for the product submissions rendered, and users earn rewards for completing these tasks.
- MAIN ACCOUNT RULE: Users must complete their first set of 35/35 tasks. Once finished, they MUST contact Customer Service to request a manual account reset before they can continue earning.
- TRAINING ACCOUNT RULE: Users in the training account must complete their first set of 45/45 tasks. Once finished, they MUST contact Customer Service to request a training account reset.

INSTRUCTION ON PROCESSING USER QUERIES:
1. Deeply analyze the customer's incoming message against the operational rules above.
2. If a customer states they have completed 35/35 tasks or 45/45 tasks, recognize that they are eligible for an account reset and provide clear guidance on the next steps.
3. If they ask about how the app works, explain the merchant visibility and product submission model clearly.
4. Generate exactly 5 distinct variations according to these strict tones:
   - PROFESSIONAL: Polished, authoritative, structured, and highly capable.
   - EMPATHETIC: Understanding, supportive, human-centric, yet deeply helpful and solution-oriented.
   - SHORT: Crisp, direct to the point, answering the core question instantly.
   - DETAILED: A comprehensive, step-by-step breakdown or deep explanation of the solution.
   - TECHNICAL: Analytical, precise, focusing on task counts (35/35 or 45/45), system mechanics, or reset troubleshooting steps.

CRITICAL FORMATTING RULE: Return the final text for all 5 suggestions entirely in CAPITAL LETTERS (UPPERCASE).`;

    // Prepare the API request
    const userPrompt = `CUSTOMER MESSAGE: ${message}${context}

Generate 5 distinct response variations (PROFESSIONAL, EMPATHETIC, SHORT, DETAILED, TECHNICAL) for this customer inquiry. Return each suggestion as a separate line in the following JSON format:
{
  "suggestions": [
    {"type": "PROFESSIONAL", "content": "RESPONSE_TEXT"},
    {"type": "EMPATHETIC", "content": "RESPONSE_TEXT"},
    {"type": "SHORT", "content": "RESPONSE_TEXT"},
    {"type": "DETAILED", "content": "RESPONSE_TEXT"},
    {"type": "TECHNICAL", "content": "RESPONSE_TEXT"}
  ]
}`;

    console.log('[AI Suggestions] Calling OpenAI API...');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Can be upgraded to gpt-4 for better quality
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.6, // Balanced creativity and factual accuracy (0.5-0.7 range)
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[AI Suggestions] OpenAI API error:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to generate suggestions from OpenAI' });
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    console.log('[AI Suggestions] AI response received');

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('[AI Suggestions] Failed to parse AI response:', parseError);
      // Fallback: try to extract suggestions manually
      return res.status(500).json({ success: false, error: 'Failed to parse AI response' });
    }

    // Validate the response structure
    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
      console.error('[AI Suggestions] Invalid response structure:', parsedResponse);
      return res.status(500).json({ success: false, error: 'Invalid response format from AI' });
    }

    // Ensure all suggestions are in uppercase as per the critical rule
    const uppercaseSuggestions = parsedResponse.suggestions.map(suggestion => ({
      type: suggestion.type,
      content: suggestion.content.toUpperCase()
    }));

    console.log('[AI Suggestions] Successfully generated 5 suggestions');

    return res.status(200).json({
      success: true,
      suggestions: uppercaseSuggestions
    });

  } catch (error) {
    console.error('[AI Suggestions] Exception:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate suggestions: ' + (error?.message || 'Unknown error') });
  }
}
