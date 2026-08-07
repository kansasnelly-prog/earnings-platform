import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

let supabase: SupabaseClient;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error('CRITICAL: Supabase environment variables are missing in creditService.');
  // @ts-ignore
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({ data: [], error: { message: 'Supabase not initialized' } }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

/**
 * Award credits based on user activity for the current day.
 */
export async function calculateAndAwardCredits(userId: string): Promise<void> {
  if (!supabase) {
    console.error('Supabase client is not initialized in calculateAndAwardCredits');
    return;
  }
  try {
    const { data: activityLogs, error: activityError } = await supabase
      .from('user_activity_logs')
      .select('activity_duration_minutes')
      .eq('user_id', userId)
      .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    if (activityError) {
      console.error('Error fetching activity logs:', activityError);
      return;
    }

    const totalActiveMinutesToday = activityLogs?.reduce((sum, log) => sum + log.activity_duration_minutes, 0) ?? 0;
    const creditsEarned = Math.floor(totalActiveMinutesToday / 5);

    const { data: existingCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credit_balance, daily_allotment_reset')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing credits:', fetchError);
      return;
    }

    let newCreditBalance = creditsEarned;
    let dailyAllotmentReset = new Date();

    if (existingCredits) {
      const lastReset = new Date(existingCredits.daily_allotment_reset);
      const now = new Date();
      if (lastReset.toDateString() !== now.toDateString()) {
        newCreditBalance = creditsEarned;
        dailyAllotmentReset = now;
      } else {
        newCreditBalance = existingCredits.credit_balance + creditsEarned;
        dailyAllotmentReset = lastReset;
      }
    }

    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert(
        {
          user_id: userId,
          credit_balance: newCreditBalance,
          daily_allotment_reset: dailyAllotmentReset.toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (updateError) {
      console.error('Error updating user credits:', updateError);
    }
  } catch (err) {
    console.error('Unhandled error in calculateAndAwardCredits:', err);
  }
}

/**
 * Retrieve the user's credit balance. If the user has no row yet, a default
 * row with 999 credits is inserted and that value is returned.
 */
export async function getUserCredits(userId: string): Promise<{ credit_balance: number | null; error: any }> {
  if (!supabase) {
    console.error('Supabase client is not initialized in getUserCredits');
    return { credit_balance: null, error: new Error('Supabase not initialized') };
  }
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credit_balance, daily_allotment_reset')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user credits:', error);
    }

    if (!data) {
      const defaultCredits = 999;
      const { error: insertErr } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credit_balance: defaultCredits,
          daily_allotment_reset: new Date().toISOString(),
        })
        .maybeSingle();
      if (insertErr) {
        console.error('Error inserting default credits:', insertErr);
        return { credit_balance: null, error: insertErr };
      }
      return { credit_balance: defaultCredits, error: null };
    }

    return { credit_balance: data.credit_balance, error: null };
  } catch (err) {
    console.error('Unhandled error in getUserCredits:', err);
    return { credit_balance: null, error: err };
  }
}

/**
 * Deduct a specified amount of credits from the user.
 */
export async function deductCredits(userId: string, amount: number): Promise<{ success: boolean; error: any }> {
  if (!supabase) {
    console.error('Supabase client is not initialized in deductCredits');
    return { success: false, error: new Error('Supabase not initialized') };
  }
  try {
    const { data: existingCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing credits for deduction:', fetchError);
      return { success: false, error: fetchError };
    }

    if (!existingCredits || existingCredits.credit_balance < amount) {
      return { success: false, error: new Error('Insufficient credits') };
    }

    const newBalance = existingCredits.credit_balance - amount;
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credit_balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error deducting credits:', updateError);
      return { success: false, error: updateError };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error('Unhandled error in deductCredits:', err);
    return { success: false, error: err };
  }
}
