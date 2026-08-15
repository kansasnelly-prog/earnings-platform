export interface ExecutiveAlertData {
  type: 'yield' | 'revenue_pulse' | 'transaction_alert' | 'executive_broadcast';
  data?: Record<string, any>;
  message?: string;
  chatId?: string;
}

class TelegramExecutiveAlertService {
  private static API_URL = '/api/telegram-alert';
  private static isInitialized = false;

  static initialize() {
    if (typeof window === 'undefined') return;
    this.isInitialized = true;
    console.log('[ExecutiveAlert] Service initialized');
  }

  static async sendAlert(alertData: ExecutiveAlertData): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[ExecutiveAlert] Alert sent: ${alertData.type}`);
        return { success: true };
      } else {
        console.error('[ExecutiveAlert] Failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[ExecutiveAlert] Network error:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendYieldAlert(amount: number, signature: string, recipient?: string) {
    return this.sendAlert({
      type: 'yield',
      data: {
        amount: amount.toFixed(4),
        signature,
        recipient: recipient || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL',
        status: 'CONFIRMED',
      },
    });
  }

  static async sendRevenuePulse(gathered: number, target: number) {
    return this.sendAlert({
      type: 'revenue_pulse',
      data: {
        gathered: gathered.toFixed(2),
        target: target.toString(),
      },
    });
  }

  static async sendTransactionAlert(type: string, amount: number, from?: string, to?: string) {
    return this.sendAlert({
      type: 'transaction_alert',
      data: {
        type,
        amount: amount.toFixed(4),
        from,
        to: to || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL',
      },
    });
  }

  static async sendExecutiveBroadcast(message: string) {
    return this.sendAlert({
      type: 'executive_broadcast',
      data: { message },
    });
  }
}

export default TelegramExecutiveAlertService;
