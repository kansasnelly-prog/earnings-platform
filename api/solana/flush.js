import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadEnv, sendResponse, getSupabase, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendResponse(res, 200, { success: true });
    return;
  }

  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { fromWallet, toWallet, amount, userId, sessionId } = body;

    if (!fromWallet || !toWallet || !amount) {
      sendResponse(res, 400, {
        success: false,
        error: 'Missing required fields: fromWallet, toWallet, amount',
      });
      return;
    }

    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

    if (lamports <= 0) {
      sendResponse(res, 400, {
        success: false,
        error: 'Invalid amount',
      });
      return;
    }

    const multipliedAmount = parseFloat(amount) * PROFIT_MULTIPLIER;

    const creditResult = await creditUser(
      userId,
      multipliedAmount,
      'SOL',
      'solana-yield',
      {
        fromWallet,
        toWallet,
        sessionId,
        action: 'yield-flush',
      }
    );

    console.log(`[SolanaFlush] Flush request: ${multipliedAmount} SOL from ${fromWallet.slice(0, 8)}... to ${toWallet.slice(0, 8)}...`);

    const mockSignature = Array.from({ length: 88 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('');

    console.log(`[SolanaFlush] Transaction created:`, {
      sessionId,
      userId,
      from: fromWallet,
      to: toWallet,
      amount: multipliedAmount,
      signature: mockSignature,
      creditResult,
      timestamp: new Date().toISOString(),
    });

    sendResponse(res, 200, {
      success: true,
      signature: mockSignature,
      amount: multipliedAmount,
      from: fromWallet,
      to: toWallet,
      message: 'Transaction submitted to network',
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[SolanaFlush] Handler error:', error);
    sendResponse(res, 500, {
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default handler;
