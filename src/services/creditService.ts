
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

let supabase: SupabaseClient;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error("CRITICAL: Supabase environment variables are missing in creditService.");
  // @ts-ignore
  supabase = { from: () => ({ select: () => ({ eq: () => ({ gte: () => ({ data: [], error: { message: "Supabase not initialized" } }) }) }) }) };
}

export async function calculateAndAwardCredits(userId: string): Promise<void> {
  const { data: activityLogs, error: activityError } = await supabase
    .from('user_activity_logs')
    .select('activity_duration_minutes')
    .eq('user_id', userId)
    .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()); // Get logs for today

  if (activityError) {
    console.error('Error fetching activity logs:', activityError);
    return;
  }

  let totalActiveMinutesToday = 0;
  if (activityLogs) {
    totalActiveMinutesToday = activityLogs.reduce((sum, log) => sum + log.activity_duration_minutes, 0);
  }

  const creditsEarned = Math.floor(totalActiveMinutesToday / 5); // 1 credit per 5 active minutes

  // Update user_credits table
  const { data: existingCredits, error: fetchError } = await supabase
    .from('user_credits')
    .select('credit_balance, daily_allotment_reset')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching existing credits:', fetchError);
    return;
  }

  let newCreditBalance = creditsEarned;
  let dailyAllotmentReset = new Date();

  if (existingCredits) {
    const lastReset = new Date(existingCredits.daily_allotment_reset);
    const now = new Date();

    // If the last reset was not today, reset the daily allotment
    if (lastReset.toDateString() !== now.toDateString()) {
      newCreditBalance = creditsEarned; // Reset to new earned credits for today
      dailyAllotmentReset = now; // Update reset timestamp
    } else {
      newCreditBalance = existingCredits.credit_balance + creditsEarned; // Add to existing balance
      dailyAllotmentReset = lastReset; // Keep existing reset timestamp
    }
  }

  const { error: updateError } = await supabase
    .from('user_credits')
    .upsert(
      { user_id: userId, credit_balance: newCreditBalance, daily_allotment_reset: dailyAllotmentReset.toISOString() },
      { onConflict: 'user_id' }
    );

  if (updateError) {
    console.error('Error updating user credits:', updateError);
  }
}

export async function getUserCredits(userId: string): Promise<{ credit_balance: number | null, error: any }> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credit_balance')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user credits:', error);
    return { credit_balance: null, error };
  }

  return { credit_balance: data ? data.credit_balance : 0, error: null };
}

export async function deductCredits(userId: string, amount: number): Promise<{ success: boolean, error: any }> {
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
}
