// Server-side Telegram notification helper
// This function can be called directly from API routes without going through the client

interface TelegramNotificationOptions {
  type: 'admin_reset_personal' | 'admin_reset_training' | 'user_login' | 'wallet_bind' | 'wallet_unbind' | 'monetized_alert';
  email?: string;
  accountType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  timestamp?: string;
  walletAddress?: string;
  chatId?: string;
  message?: string;
  messageType?: string;
  userId?: string;
  inlineKeyboard?: any;
}

export async function sendTelegramNotification(options: TelegramNotificationOptions): Promise<boolean> {
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('[TelegramHelper] Missing environment variables: VITE_TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_CHAT_ID');
      return false;
    }

    let message = '';

    switch (options.type) {
      case 'admin_reset_personal':
        message = `🔔 [Admin Notification]\n` +
                 `Personal Account Successfully Reset!\n` +
                 `• User Email: ${options.email}\n` +
                 `• Timestamp: ${options.timestamp || new Date().toISOString()}`;
        break;

      case 'admin_reset_training':
        message = `🔔 [Admin Notification]\n` +
                 `Training Account Successfully Reset!\n` +
                 `• User Email: ${options.email}\n` +
                 `• Timestamp: ${options.timestamp || new Date().toISOString()}`;
        break;

      case 'user_login':
        message = `🔐 [User Login]\n` +
                 `• User Email: ${options.email}\n` +
                 `• Account Type: ${options.accountType?.toUpperCase() || 'N/A'}\n` +
                 `• Device: ${options.deviceName || 'Unknown'}\n` +
                 `• Browser: ${options.browser || 'Unknown'}\n` +
                 `• OS: ${options.os || 'Unknown'}\n` +
                 `• IP Address: ${options.ipAddress || 'Unknown'}\n` +
                 `• Timestamp: ${options.timestamp || new Date().toISOString()}`;
        break;

      case 'wallet_bind':
        message = `💼 [Wallet Bound]\n` +
                 `• User Email: ${options.email}\n` +
                 `• Account Type: ${options.accountType?.toUpperCase() || 'N/A'}\n` +
                 `• Wallet Address: ${options.walletAddress || 'N/A'}\n` +
                 `• Timestamp: ${options.timestamp || new Date().toISOString()}`;
        break;

      case 'wallet_unbind':
        message = `🔓 [Wallet Unbound]\n` +
                 `• User Email: ${options.email}\n` +
                 `• Account Type: ${options.accountType?.toUpperCase() || 'N/A'}\n` +
                 `• Timestamp: ${options.timestamp || new Date().toISOString()}`;
        break;

      case 'monetized_alert':
        message = options.message || '📢 [Monetized Alert]';
        break;

      default:
        message = `📢 [Notification]\n${JSON.stringify(options)}`;
    }

    if (options.type === 'monetized_alert' && options.chatId) {
      const response = await fetch('/api/telegram/monetized-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: options.chatId,
          message: options.message,
          messageType: options.messageType || 'default',
          userId: options.userId,
          inlineKeyboard: options.inlineKeyboard,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[TelegramHelper] Monetized alert failed:', text);
        return false;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.error('[TelegramHelper] Monetized alert failed:', result);
        return false;
      }

      console.log('[TelegramHelper] Monetized alert sent successfully');
      return true;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    console.log('[TelegramHelper] Sending notification:', options.type);

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

    if (!response.ok) {
      const text = await response.text();
      console.error('[TelegramHelper] Failed to send notification:', text);
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('[TelegramHelper] Non-JSON response:', text);
      return false;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('[TelegramHelper] Failed to send notification:', data);
      return false;
    }

    console.log('[TelegramHelper] Notification sent successfully:', data.result?.message_id);
    return true;

  } catch (error) {
    console.error('[TelegramHelper] Exception sending notification:', error);
    return false;
  }
}
