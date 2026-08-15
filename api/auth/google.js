import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      envVars[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return envVars;
}

const ENV = loadEnv();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { code, redirectUri } = body;

    if (!code) {
      return sendResponse(res, 400, { success: false, error: 'Missing authorization code' });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: ENV.GOOGLE_CLIENT_ID || '',
        client_secret: ENV.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri || '',
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('[GoogleOAuth] Token exchange error:', tokens.error);
      return sendResponse(res, 400, {
        success: false,
        error: tokens.error_description || tokens.error,
      });
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userResponse.json();

    if (userInfo.error) {
      console.error('[GoogleOAuth] User info error:', userInfo.error);
      return sendResponse(res, 400, {
        success: false,
        error: userInfo.error.message || 'Failed to get user info',
      });
    }

    // Store refresh token securely
    if (tokens.refresh_token) {
      // In production, store this in a secure database
      console.log('[GoogleOAuth] Refresh token received (store securely)');
    }

    console.log(`[GoogleOAuth] User authenticated: ${userInfo.email}`);

    return sendResponse(res, 200, {
      success: true,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    });
  } catch (error) {
    console.error('[GoogleOAuth] Handler error:', error);
    return sendResponse(res, 500, {
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default handler;
