// Telegram login alert notifier
// This service provides helper functions to detect device and browser
// information and sends a login alert to a configured Telegram bot.
// It is intentionally lightweight and does not modify any existing
// authentication logic.

/**
 * Detects the device category based on the user agent string.
 * @returns {string} One of: iPhone, Android, Windows PC, Mac, Other
 */
export function getDeviceCategory(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows NT/.test(ua)) return 'Windows PC';
  if (/Macintosh/.test(ua)) return 'Mac';
  return 'Other';
}

/**
 * Returns the browser user agent string.
 * @returns {string}
 */
export function getBrowserInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  return navigator.userAgent;
}

/**
 * Builds the Telegram message payload for a login alert.
 * @param email User's email address
 * @param deviceType Detected device category
 * @param browserInfo Browser user agent string
 * @returns {string} Formatted message
 */
export function buildTelegramMessage(
  email: string,
  deviceType: string,
  browserInfo: string
): string {
  return `🚨 SECURITY MATRIX: NEW LOGIN DETECTED!\n──────────────────────\n📧 USER EMAIL: ${email}\n📱 HARDWARE: ${deviceType}\n🌐 BROWSER AGENT: ${browserInfo}\n🛰️ STATUS LOG: 100% SUCCESSFUL HANDSHAKE`;
}

/**
 * Sends a login alert to Telegram. The function is async but returns void
 * to avoid blocking the authentication flow. Errors are caught and logged
 * but never propagated.
 * @param email User's email address
 */
export async function sendTelegramLoginAlert(email: string): Promise<void> {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn('Telegram bot token or chat ID not configured.');
    return;
  }
  const deviceType = getDeviceCategory();
  const browserInfo = getBrowserInfo();
  const message = buildTelegramMessage(email, deviceType, browserInfo);
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.warn('Failed to send Telegram login alert:', err);
  }
}
