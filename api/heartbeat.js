import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL ERROR: Supabase credentials missing for heartbeat API.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const HEARTBEAT_INTERVAL_MS = 10_000;
const MIN_WATCH_SECONDS_PER_PING = 1;

async function verifySession(req) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
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
    const { videoTimestamp, sessionToken } = body || {};

    if (!sessionToken || typeof videoTimestamp !== 'number') {
      return res.status(400).json({ error: 'Invalid heartbeat payload' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, watch_balance, last_heartbeat_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const now = new Date().toISOString();
    const lastHeartbeat = profile.last_heartbeat_at ? new Date(profile.last_heartbeat_at) : null;
    const nextAllowed = lastHeartbeat ? new Date(lastHeartbeat.getTime() + HEARTBEAT_INTERVAL_MS) : null;

    if (nextAllowed && new Date(now) < nextAllowed) {
      return res.status(429).json({ error: 'Heartbeat throttled', retryAfter: Math.max(0, Math.ceil((nextAllowed - new Date(now)) / 1000)) });
    }

    const newBalance = (profile.watch_balance || 0) + MIN_WATCH_SECONDS_PER_PING;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        watch_balance: newBalance,
        last_heartbeat_at: now,
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    return res.status(200).json({
      success: true,
      watchBalance: newBalance,
      credited: MIN_WATCH_SECONDS_PER_PING,
      videoTimestamp,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Heartbeat failed', message: error.message });
  }
}
