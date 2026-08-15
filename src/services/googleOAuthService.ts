export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  masterEmail: string;
}

export interface GoogleOAuthResult {
  success: boolean;
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
}

class GoogleOAuthService {
  private static config: GoogleOAuthConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
    scope: 'openid profile email',
    masterEmail: 'kansasnelly@gmail.com',
  };

  private static isInitialized = false;

  static initialize() {
    if (typeof window === 'undefined') return;
    this.isInitialized = true;
    console.log('[GoogleOAuth] Service initialized');
  }

  static getMasterEmail(): string {
    return this.config.masterEmail;
  }

  static isMasterEmail(email: string): boolean {
    return email.toLowerCase() === this.config.masterEmail.toLowerCase();
  }

  static async initiateOAuth(): Promise<GoogleOAuthResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.config.clientId) {
      return {
        success: false,
        error: 'Google OAuth client ID not configured',
      };
    }

    try {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', this.config.clientId);
      authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', this.config.scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', 'sreymara_tma');

      // Open in Telegram WebApp if available
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.openLink(authUrl.toString());
      } else {
        window.location.href = authUrl.toString();
      }

      return { success: true };
    } catch (error: any) {
      console.error('[GoogleOAuth] Failed to initiate:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate Google OAuth',
      };
    }
  }

  static async handleCallback(code: string): Promise<GoogleOAuthResult> {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri: this.config.redirectUri }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('[GoogleOAuth] Authentication successful for:', result.email);
        return {
          success: true,
          email: result.email,
          name: result.name,
          picture: result.picture,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error: any) {
      console.error('[GoogleOAuth] Callback error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      const stored = localStorage.getItem('google_access_token');
      if (stored) return stored;

      const refreshToken = localStorage.getItem('google_refresh_token');
      if (!refreshToken) return null;

      const response = await fetch('/api/auth/google-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();
      if (result.success && result.access_token) {
        localStorage.setItem('google_access_token', result.access_token);
        return result.access_token;
      }

      return null;
    } catch (error) {
      console.error('[GoogleOAuth] Failed to get access token:', error);
      return null;
    }
  }

  static async sendExecutiveAlert(email: string, name: string) {
    try {
      const isMaster = this.isMasterEmail(email);
      const alertType = isMaster ? 'master_oauth_login' : 'user_oauth_login';

      await fetch('/api/telegram-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'executive_broadcast',
          data: {
            message: `🔐 <b>${isMaster ? 'MASTER' : 'USER'} GOOGLE OAUTH LOGIN</b>\n\n` +
                    `📧 Email: ${email}\n` +
                    `👤 Name: ${name}\n` +
                    `⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}\n` +
                    `🔗 Status: Authenticated via Google SSO\n` +
                    `🌐 Network: Telegram Mini App\n` +
                    `\n${isMaster ? '✅ Master identity verified - SREYMARA Executive Access Granted' : '👤 User access granted'}`,
          },
        }),
      });
    } catch (error) {
      console.error('[GoogleOAuth] Failed to send alert:', error);
    }
  }
}

export default GoogleOAuthService;
