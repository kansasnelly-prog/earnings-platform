import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('CRITICAL ERROR: Supabase credentials missing for cinema stream-reward API.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, videoId, watchDurationSeconds, rewardAmount, sessionId, metadata } = req.body;

    if (!userId || !videoId || typeof watchDurationSeconds !== 'number') {
      return res.status(400).json({ error: 'Missing required fields: userId, videoId, watchDurationSeconds' });
    }

    const reward = Number(rewardAmount) || 0.01;
    const multiplier = metadata?.multiplier || 12;
    const boostedReward = reward * multiplier;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, watch_balance, total_watched_seconds, cinema_earnings')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const newBalance = (profile.watch_balance || 0) + boostedReward;
    const totalWatched = (profile.total_watched_seconds || 0) + watchDurationSeconds;
    const cinemaEarnings = (profile.cinema_earnings || 0) + boostedReward;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        watch_balance: newBalance,
        total_watched_seconds: totalWatched,
        cinema_earnings: cinemaEarnings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[StreamReward] Error updating user balance:', updateError);
      return res.status(500).json({ error: 'Failed to update balance' });
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

    return res.status(200).json({
      success: true,
      reward: boostedReward,
      baseReward: reward,
      multiplier,
      newBalance,
      cinemaEarnings,
      totalWatchedSeconds: totalWatched,
      videoId,
    });
  } catch (error: any) {
    console.error('[StreamReward] Exception:', error);
    return res.status(500).json({ error: 'Stream reward failed', message: error.message });
  }
}
