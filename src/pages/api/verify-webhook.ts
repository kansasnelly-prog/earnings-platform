import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = 'https://earnings.ink/api/webhook';

  if (!token) {
    return res.status(500).json({
      status: 'error',
      message: 'TELEGRAM_BOT_TOKEN not found in environment variables',
      webhookUrl,
      webhookRegistered: false
    });
  }

  try {
    // Check current webhook info
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfo = await webhookInfoResponse.json();

    // Check if webhook is set to our URL
    const currentWebhookUrl = webhookInfo.result?.url;
    const isWebhookSet = currentWebhookUrl === webhookUrl;
    const hasWebhookErrors = webhookInfo.result?.last_error_date || webhookInfo.result?.last_error_message;

    // Test webhook endpoint availability
    let webhookEndpointStatus = 'unknown';
    try {
      const testResponse = await fetch(webhookUrl, { method: 'GET' });
      webhookEndpointStatus = testResponse.ok ? 'online' : 'error';
    } catch (error) {
      webhookEndpointStatus = 'unreachable';
    }

    return res.status(200).json({
      status: 'success',
      webhookUrl,
      webhookRegistered: isWebhookSet,
      currentWebhookUrl,
      webhookEndpointStatus,
      hasWebhookErrors,
      lastErrorDate: webhookInfo.result?.last_error_date,
      lastErrorMessage: webhookInfo.result?.last_error_message,
      pendingUpdateCount: webhookInfo.result?.pending_update_count,
      environmentVariables: {
        telegramBotToken: !!token,
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        openaiApiKey: !!process.env.OPENAI_API_KEY
      },
      recommendations: !isWebhookSet ? [
        'Webhook is not registered. Run: curl -F "url=' + webhookUrl + '" https://api.telegram.org/bot<TOKEN>/setWebhook'
      ] : hasWebhookErrors ? [
        'Webhook has errors. Check last_error_message for details.'
      ] : [
        'Webhook is properly configured and operational.'
      ]
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to verify webhook status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
