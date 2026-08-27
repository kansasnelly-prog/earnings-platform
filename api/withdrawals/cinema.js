import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
const USDT_MINT_ADDRESS = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const ADMIN_PRIVATE_KEY = process.env.SOLANA_ADMIN_PRIVATE_KEY || '';

if (!ADMIN_PRIVATE_KEY) {
  console.warn('[Withdraw] SOLANA_ADMIN_PRIVATE_KEY is not set. Withdrawals will fail in production.');
}

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
    const { destinationWallet, amountUSDT, amountSOL, network } = body;

    if (!destinationWallet || (!amountUSDT && !amountSOL)) {
      return sendResponse(res, 400, { success: false, error: 'Missing destinationWallet or amounts' });
    }

    if (!ADMIN_PRIVATE_KEY) {
      return sendResponse(res, 500, { success: false, error: 'Server misconfiguration: missing admin private key' });
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
      return sendResponse(res, 500, { success: false, error: 'Transaction failed', details: confirmation.value.err });
    }

    return sendResponse(res, 200, {
      success: true,
      txHash: signature,
      network: network || 'solana-mainnet',
      destinationWallet,
      amountUSDT: Number(amountUSDT) || 0,
      amountSOL: Number(amountSOL) || 0,
    });
  } catch (error) {
    console.error('[Withdraw] Handler error:', error);
    return sendResponse(res, 500, { success: false, error: error.message || 'Internal server error' });
  }
}

export default handler;
