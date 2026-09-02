import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
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
const SUPABASE_URL = ENV.VITE_SUPABASE_URL || ENV.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || '';
const MASTER_WALLET = ENV.MASTER_WALLET || '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';
const PROFIT_MULTIPLIER = 12;
const MASTER_CUT_PERCENT = 0.15;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function creditUser(userId, amount, currency, source, metadata = {}) {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  const numericAmount = Number(amount) || 0;
  if (numericAmount <= 0) return null;

  const masterCut = numericAmount * MASTER_CUT_PERCENT;
  const userCredit = numericAmount - masterCut;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, balance, total_earned, watch_balance, cinema_earnings, wallet_address')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const updates = {
    balance: (profile.balance || 0) + userCredit,
    total_earned: (profile.total_earned || 0) + userCredit,
  };

  if (source === 'cinema' || source === 'stream') {
    updates.watch_balance = (profile.watch_balance || 0) + userCredit;
    updates.cinema_earnings = (profile.cinema_earnings || 0) + userCredit;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (updateError) {
    return null;
  }

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: userId,
    type: source === 'cinema' ? 'stream_reward' : 'earning',
    amount: userCredit,
    description: `${source} earning credited`,
    status: 'completed',
    metadata: {
      source,
      master_wallet: MASTER_WALLET,
      master_cut: masterCut,
      gross_amount: numericAmount,
      currency: currency || 'USDT',
      ...metadata,
    },
    created_at: new Date().toISOString(),
  });

  if (txError) {
    console.error('[Backend] Transaction log failed:', txError);
  }

  return {
    userId,
    credited: userCredit,
    masterCut,
    gross: numericAmount,
    currency: currency || 'USDT',
    source,
    newBalance: updates.balance,
    masterWallet: MASTER_WALLET,
  };
}

export { loadEnv, sendResponse, getSupabase, creditUser, MASTER_WALLET, PROFIT_MULTIPLIER, MASTER_CUT_PERCENT, corsHeaders };
