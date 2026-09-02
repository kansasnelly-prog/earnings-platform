import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { loadEnv, sendResponse, getSupabase, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, corsHeaders } from '../_shared/supabaseBackend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
const USDT_MINT_ADDRESS = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const ADMIN_PRIVATE_KEY = process.env.SOLANA_ADMIN_PRIVATE_KEY || '';

if (!ADMIN_PRIVATE_KEY) {
  console.warn('[CinemaWithdraw] SOLANA_ADMIN_PRIVATE_KEY is not set. Withdrawals will fail in production.');
}

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
    const { destinationWallet, amountUSDT, amountSOL, network, userId, videoId, watchDurationSeconds, multiplier } = body;

    if (!destinationWallet || (!amountUSDT && !amountSOL)) {
      sendResponse(res, 400, { success: false, error: 'Missing destinationWallet or amounts' });
      return;
    }

    const creditResult = await creditUser(
      userId,
      amountUSDT || amountSOL || 0,
      amountUSDT ? 'USDT' : 'SOL',
      'cinema',
      {
        videoId: videoId || 'unknown',
        watchDurationSeconds: watchDurationSeconds || 0,
        multiplier: multiplier || 1,
        destinationWallet,
      }
    );

    if (!ADMIN_PRIVATE_KEY) {
      sendResponse(res, 200, {
        success: true,
        simulated: true,
        creditResult,
        message: 'Withdrawal simulated - admin key not configured',
        network: network || 'solana-mainnet',
        destinationWallet,
        amountUSDT: Number(amountUSDT) || 0,
        amountSOL: Number(amountSOL) || 0,
        masterWallet: MASTER_WALLET,
      });
      return;
    }

    const adminKeypair = Keypair.fromSecretKey(Buffer.from(ADMIN_PRIVATE_KEY, 'base64'));
    const transaction = new Transaction();

    if (amountUSDT > 0) {
      const adminUsdtAccount = await getAssociatedTokenAddress(USDT_MINT_ADDRESS, adminKeypair.publicKey);
      const userUsdtAccount = await getAssociatedTokenAddress(USDT_MINT_ADDRESS, new PublicKey(destinationWallet));
      const usdtAmountInDecimals = Math.floor(Number(amountUSDT) * 1000000);

      transaction.add(
        createTransferInstruction(
          adminUsdtAccount,
          userUsdtAccount,
          adminKeypair.publicKey,
          usdtAmountInDecimals
        )
      );
    }

    if (amountSOL > 0) {
      const solAmountInLamports = Math.floor(Number(amountSOL) * LAMPORTS_PER_SOL);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: adminKeypair.publicKey,
          toPubkey: new PublicKey(destinationWallet),
          lamports: solAmountInLamports,
        })
      );
    }

    const signature = await connection.sendTransaction(transaction, [adminKeypair]);
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      sendResponse(res, 500, { success: false, error: 'Transaction failed', details: confirmation.value.err, creditResult });
      return;
    }

    sendResponse(res, 200, {
      success: true,
      txHash: signature,
      network: network || 'solana-mainnet',
      destinationWallet,
      amountUSDT: Number(amountUSDT) || 0,
      amountSOL: Number(amountSOL) || 0,
      creditResult,
      masterWallet: MASTER_WALLET,
    });
  } catch (error) {
    console.error('[CinemaWithdraw] Handler error:', error);
    sendResponse(res, 500, { success: false, error: error.message || 'Internal server error' });
  }
}

export default handler;
