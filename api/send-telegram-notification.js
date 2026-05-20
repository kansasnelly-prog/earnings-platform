// Server-side Telegram notification API route
// This function is server-side only and does not expose tokens to the frontend

export default async function handler(req, res) {
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
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('[Telegram] Missing environment variables: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      return res.status(500).json({
        success: false,
        error: 'Telegram configuration missing'
      });
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    console.log('[Telegram] Sending message:', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Telegram] Failed to send message:', data);
      return res.status(500).json({
        success: false,
        error: 'Failed to send Telegram message',
        details: data
      });
    }

    console.log('[Telegram] Message sent successfully:', data.result?.message_id);

    return res.status(200).json({
      success: true,
      messageId: data.result?.message_id
    });

  } catch (error) {
    console.error('[Telegram] Exception:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
