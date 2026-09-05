import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey } from '@solana/web3.js';

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
    const { signature } = body;

    if (!signature) {
      return sendResponse(res, 400, {
        verified: false,
        error: 'Missing signature',
      });
    }

    // In production, verify the transaction on Solana network
    const connection = new Connection(
      ENV.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    try {
      const txStatus = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (txStatus.value) {
        const isConfirmed = txStatus.value.confirmationStatus === 'confirmed' ||
          txStatus.value.confirmationStatus === 'finalized';

        return sendResponse(res, 200, {
          verified: isConfirmed,
          signature,
          confirmationStatus: txStatus.value.confirmationStatus,
          blockTime: txStatus.value.blockTime,
          slot: txStatus.value.slot,
        });
      }

      return sendResponse(res, 200, {
        verified: false,
        signature,
        message: 'Transaction not found or not yet confirmed',
      });
    } catch (error) {
      console.error('[SolanaVerify] RPC error:', error);
      return sendResponse(res, 500, {
        verified: false,
        error: 'RPC verification failed',
      });
    }
  } catch (error) {
    console.error('[SolanaVerify] Handler error:', error);
    return sendResponse(res, 500, {
      verified: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default handler;
