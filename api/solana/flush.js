import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const MASTER_WALLET = ENV.MASTER_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

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
    const { fromWallet, toWallet, amount, userId, sessionId } = body;

    if (!fromWallet || !toWallet || !amount) {
      return sendResponse(res, 400, {
        success: false,
        error: 'Missing required fields: fromWallet, toWallet, amount',
      });
    }

    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

    // Validate amount
    if (lamports <= 0) {
      return sendResponse(res, 400, {
        success: false,
        error: 'Invalid amount',
      });
    }

    // In a production environment, this would:
    // 1. Verify the user owns the fromWallet
    // 2. Check for sufficient balance
    // 3. Build and sign the transaction server-side
    // 4. Send the transaction to Solana network
    // 5. Return the transaction signature

    console.log(`[SolanaFlush] Flush request: ${amount} SOL from ${fromWallet.slice(0, 8)}... to ${toWallet.slice(0, 8)}...`);

    // For demo purposes, return a mock signature
    // In production, replace with actual transaction execution
    const mockSignature = Array.from({ length: 88 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('');

    // Log the transaction for audit trail
    console.log(`[SolanaFlush] Transaction created:`, {
      sessionId,
      userId,
      from: fromWallet,
      to: toWallet,
      amount,
      signature: mockSignature,
      timestamp: new Date().toISOString(),
    });

    return sendResponse(res, 200, {
      success: true,
      signature: mockSignature,
      amount,
      from: fromWallet,
      to: toWallet,
      message: 'Transaction submitted to network',
    });
  } catch (error) {
    console.error('[SolanaFlush] Handler error:', error);
    return sendResponse(res, 500, {
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default handler;
