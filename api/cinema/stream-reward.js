import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[CinemaStreamReward] Supabase credentials missing');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  if (typeof res.writeHead === 'function') {
    res.writeHead(statusCode, corsHeaders);
    res.end(JSON.stringify(data));
  } else if (typeof res.status === 'function') {
    res.status(statusCode).json(data);
  } else if (typeof res.end === 'function') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json');
    }
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  }
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
    const { userId, videoId, watchDurationSeconds, rewardAmount, sessionId, metadata } = body;

    if (!userId || !videoId || typeof watchDurationSeconds !== 'number') {
      sendResponse(res, 400, { error: 'Missing required fields: userId, videoId, watchDurationSeconds' });
      return;
    }

    if (!supabase) {
      sendResponse(res, 500, { error: 'Supabase not configured' });
      return;
    }

    const reward = Number(rewardAmount) || 0.01;
    const multiplier = metadata?.multiplier || 12;
    const boostedReward = reward * multiplier;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, watch_balance, total_watched_seconds, cinema_earnings, balance, total_earned')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      sendResponse(res, 404, { error: 'User profile not found' });
      return;
    }

    const newWatchBalance = (profile.watch_balance || 0) + boostedReward;
    const totalWatched = (profile.total_watched_seconds || 0) + watchDurationSeconds;
    const cinemaEarnings = (profile.cinema_earnings || 0) + boostedReward;
    const newBalance = (profile.balance || 0) + boostedReward;
    const newTotalEarned = (profile.total_earned || 0) + boostedReward;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        watch_balance: newWatchBalance,
        total_watched_seconds: totalWatched,
        cinema_earnings: cinemaEarnings,
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[StreamReward] Error updating user balance:', updateError);
      sendResponse(res, 500, { error: 'Failed to update balance' });
      return;
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'stream_reward',
        amount: boostedReward,
        description: `Cinema stream reward for video ${videoId} (${multiplier}x multiplier)`,
        status: 'completed',
        metadata: {
          video_id: videoId,
          watch_duration_seconds: watchDurationSeconds,
          session_id: sessionId || null,
          multiplier,
          base_reward: reward,
          region: metadata?.region || 'global',
          ...metadata,
        },
        created_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.error('[StreamReward] Error creating transaction:', transactionError);
    }

    sendResponse(res, 200, {
      success: true,
      reward: boostedReward,
      baseReward: reward,
      multiplier,
      newWatchBalance,
      cinemaEarnings,
      totalWatchedSeconds: totalWatched,
      newBalance,
      newTotalEarned,
      videoId,
    });
  } catch (error) {
    console.error('[StreamReward] Exception:', error);
    sendResponse(res, 500, { error: 'Stream reward failed', message: error.message || 'Internal server error' });
  }
}

export default handler;
