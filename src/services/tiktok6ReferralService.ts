import { supabase } from '../lib/supabase';

export const generateTikTok6ReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TYY-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createTikTok6Referral = async (userId: string, referredBy?: string) => {
    const referralCode = generateTikTok6ReferralCode();
    const { error } = await supabase
        .from('tiktok6_referrals')
        .insert({
            user_id: userId,
            referral_code: referralCode,
            referred_by: referredBy
        });
    if (error) throw error;
    return referralCode;
};

export const trackTikTok6Event = async (referralCode: string, eventType: string) => {
    const { error } = await supabase
        .from('tiktok6_referral_tracking')
        .insert({
            referral_code: referralCode,
            event_type: eventType
        });
    if (error) throw error;
};

export const recordTikTok6ReferralRevenue = async (ownerCode: string, referredUserId: string, amount: number, source: string) => {
    const { error } = await supabase
        .from('tiktok6_referral_revenue')
        .insert({
            referral_owner_code: ownerCode,
            referred_user_id: referredUserId,
            revenue_amount: amount,
            source: source
        });
    if (error) throw error;
};
