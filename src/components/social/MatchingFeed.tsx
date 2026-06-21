import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { SupabaseService } from '@/services/supabaseService';
import ShortVideoFeed from './ShortVideoFeed';
import TikTok6RegistrationGate from './TikTok6RegistrationGate';
import './MatchingFeed.css';

interface Profile {
  id: string;
  display_name: string;
  bio?: string;
  profile_type: 'single' | 'traveler';
  location?: string;
  avatar_url?: string;
}

const MatchingFeed: React.FC = () => {
  useEffect(() => {
    console.log('MATCHINGFEED MOUNT');
    return () => console.log('MATCHINGFEED UNMOUNT');
  }, []);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadUserBalance();
    parseReferralCode();

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        setLoading(false);
      }
    });

    // Safety fallback: Force loading state to false after 3 seconds
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
      setAuthLoading(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const parseReferralCode = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      
      if (refCode) {
        localStorage.setItem('dating_ref_code', refCode);
      }
    } catch (error) {
      console.error('LocalStorage error in parseReferralCode:', error);
    }
  };

  const processReferralAttribution = async (userId: string) => {
    let refCode: string | null = null;
    try {
      refCode = localStorage.getItem('dating_ref_code');
    } catch (error) {
      console.error('LocalStorage error reading dating referral code:', error);
      return; 
    }
    
    if (!refCode) return;

    try {
      const { error: referralError } = await supabase
        .from('influencer_referrals')
        .insert({
          referrer_code: refCode,
          referred_user_id: userId,
          referred_at: new Date().toISOString(),
          status: 'pending',
          coins_awarded: 0
        });

      if (referralError) throw referralError;

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: (userData?.balance || 0) + 5 })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      await supabase
        .from('influencer_referrals')
        .update({ 
          status: 'completed',
          coins_awarded: 5 
        })
        .eq('referred_user_id', userId);

      try {
        localStorage.removeItem('dating_ref_code');
      } catch (error) {
        console.error('LocalStorage error removing dating referral code:', error);
      }
      
    } catch (error) {
      console.error('Error processing dating referral:', error);
      try {
        localStorage.removeItem('dating_ref_code');
      } catch (error) {
        console.error('LocalStorage error removing dating referral code in fallback:', error);
      }
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matchmaking_profiles')
        .select('*')
        .in('profile_type', ['single', 'traveler'])
        .limit(20);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await processReferralAttribution(user.id);

      const { data, error } = await supabase
        .from('users')
        .select('balance, account_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setNellyCoins(data?.balance || 0);

      if (data?.account_type === 'admin') {
        setLoading(false);
        setAuthLoading(false);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      setNellyCoins(0);
      setLoading(false);
      setAuthLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      loadProfiles();
      setCurrentIndex(0);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (user || session) {
    return <ShortVideoFeed />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-white text-xl font-bold animate-glow">Loading profiles...</div>
      </div>
    );
  }

  return <TikTok6RegistrationGate />;
};

export default MatchingFeed;
