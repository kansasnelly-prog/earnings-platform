import { supabase } from '../lib/supabase';

// Use a secure way to reference the bot token, e.g., environment variables
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export const sendLoginNotification = async (userEmail: string) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram bot token or chat ID not configured.');
    return;
  }

  try {
    // Fetch IP and location info
    const ipResponse = await fetch('https://ipapi.co/json/');
    const locationData = await ipResponse.json();
    
    const message = `
🔔 *New Login Detected*
👤 *User:* ${userEmail}
⏰ *Time:* ${new Date().toLocaleString()}
🌐 *IP:* ${locationData.ip}
📍 *Location:* ${locationData.city}, ${locationData.country_name} (${locationData.country_code})
💻 *Device/Browser:* ${navigator.userAgent}
    `;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
