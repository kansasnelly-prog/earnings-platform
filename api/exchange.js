import { createClient } from '@supabase/supabase-js';
import { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL ERROR: Supabase credentials missing for exchange API.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const MASTER_WALLET_SECRET = process.env.MASTER_WALLET_SECRET;
const FEE_PERCENTAGE = Number(process.env.FEE_PERCENTAGE || 30);

let connection = null;
let masterKeypair = null;

function getConnection() {
  if (!connection) connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  return connection;
}

function getMasterKeypair() {
  if (!MASTER_WALLET_SECRET) {
    throw new Error('MASTER_WALLET_SECRET is not configured');
  }
  if (!masterKeypair) {
    const secretKey = Uint8Array.from(JSON.parse(MASTER_WALLET_SECRET));
    masterKeypair = Keypair.fromSecretKey(secretKey);
  }
  return masterKeypair;
}

async function verifySession(req) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function buildSolanaSplitTransaction({ masterWallet, userWallet, ownerAmount, workerAmount }) {
  const connection = getConnection();
  const sender = getMasterKeypair();

  const recipientOwner = new PublicKey(masterWallet);
  const recipientWorker = new PublicKey(userWallet);

  const { blockhash } = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: sender.publicKey,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipientOwner,
      lamports: Math.floor(ownerAmount * LAMPORTS_PER_SOL),
    }),
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipientWorker,
      lamports: Math.floor(workerAmount * LAMPORTS_PER_SOL),
    })
  );

  return transaction;
}

async function sendAndConfirmTransaction(transaction) {
  const connection = getConnection();
  const sender = getMasterKeypair();

  transaction.sign(sender);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const user = await verifySession(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userWalletAddress } = body || {};

    if (!userWalletAddress || typeof userWalletAddress !== 'string') {
      return res.status(400).json({ error: 'userWalletAddress is required' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, watch_balance, wallet_address')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userBalance = Number(profile.watch_balance || 0);
    if (userBalance <= 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('master_wallet, fee_percentage')
      .eq('id', 'global')
      .single();

    if (settingsError || !settings?.master_wallet) {
      return res.status(500).json({ error: 'System settings not configured' });
    }

    const feePercentage = Number(settings.fee_percentage || FEE_PERCENTAGE);
    const ownerAmount = userBalance * (feePercentage / 100);
    const workerAmount = userBalance * ((100 - feePercentage) / 100);

    const transaction = await buildSolanaSplitTransaction({
      masterWallet: settings.master_wallet,
      userWallet: userWalletAddress,
      ownerAmount,
      workerAmount,
    });

    const signature = await sendAndConfirmTransaction(transaction);

    await supabase
      .from('users')
      .update({ watch_balance: 0 })
      .eq('id', user.id);

    return res.status(200).json({
      success: true,
      txHash: signature,
      exchanged: userBalance,
      feePercentage,
      ownerAmount,
      workerAmount,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Exchange failed', message: error.message });
  }
}
