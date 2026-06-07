import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  display_name: string;
  bio?: string;
  profile_type: 'single' | 'traveler';
  location?: string;
  avatar_url?: string;
}

const MatchingFeed: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nellyCoins, setNellyCoins] = useState(0);

  useEffect(() => {
    loadProfiles();
    loadUserBalance();
    parseReferralCode();
  }, []);

  const parseReferralCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
      console.log('Referral code saved:', refCode);
    }
  };

  const processReferralAttribution = async (userId: string) => {
    const refCode = localStorage.getItem('referral_code');
    
    if (!refCode) return;

    try {
      // Insert referral record
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

      // Award 5 NellyCoins as onboarding bonus
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

      // Update referral record with coins awarded
      await supabase
        .from('influencer_referrals')
        .update({ 
          status: 'completed',
          coins_awarded: 5 
        })
        .eq('referred_user_id', userId);

      // Clear referral code from localStorage
      localStorage.removeItem('referral_code');
      
      console.log('Referral processed successfully');
    } catch (error) {
      console.error('Error processing referral:', error);
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
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Process referral attribution if user has a referral code
      await processReferralAttribution(user.id);

      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setNellyCoins(data?.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleSpeedMatch = async () => {
    if (nellyCoins < 10) {
      alert('Insufficient NellyCoins. You need 10 NellyCoins for Speed Match.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ balance: nellyCoins - 10 })
        .eq('id', user.id);

      if (error) throw error;

      setNellyCoins(nellyCoins - 10);
      alert('Speed Match activated! 10 NellyCoins deducted.');
      loadProfiles();
    } catch (error) {
      console.error('Error processing Speed Match:', error);
      alert('Failed to process Speed Match. Please try again.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Match Feed</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
            >
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-yellow-400 font-bold">{nellyCoins}</span>
              <span className="text-white text-sm ml-1">NC</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Button
            onClick={handleSpeedMatch}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-4 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/50"
          >
            ⚡ Speed Match (10 NC)
          </Button>
        </div>

        {currentProfile ? (
          <Card className="backdrop-blur-xl border-2 border-pink-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="aspect-[3/4] bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl mb-4 flex items-center justify-center">
                {currentProfile.avatar_url ? (
                  <img
                    src={currentProfile.avatar_url}
                    alt={currentProfile.display_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-6xl">👤</div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{currentProfile.display_name}</h2>
              <p className="text-pink-300 text-sm mb-2 capitalize">{currentProfile.profile_type}</p>
              {currentProfile.location && (
                <p className="text-gray-300 text-sm mb-3">📍 {currentProfile.location}</p>
              )}
              {currentProfile.bio && (
                <p className="text-gray-400 text-sm mb-4">{currentProfile.bio}</p>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={() => handleSwipe('left')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition-all duration-300"
                >
                  ✕ Pass
                </Button>
                <Button
                  onClick={() => handleSwipe('right')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-all duration-300"
                >
                  ♥ Like
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-xl border-2 border-pink-500/30 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Create Your Dating Profile</h2>
                <p className="text-pink-300 text-lg mb-4">Log In to Nelly Social Hub</p>
              </div>
              
              <Button
                className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg mb-6"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Log In with Google
              </Button>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">
                  Find your soulmate here, flirt 🫦, fall in love 💕 with singles and global travelers, group chats and community exclusive rooms.
                </p>
                <p className="text-pink-300 text-sm mt-4 leading-relaxed">
                  ស្វែងរកគូស្នេហ៍ពិតរបស់អ្នកនៅទីនេះ, ចែចង់ 🫦 ធ្លាក់ក្នុងអន្លង់ស្នេហ៍ 💕 ជាមួយអ្នកនៅលីវ និងអ្នកធ្វើដំណើរជុំវិញពិភពលោក, រួមទាំងក្រុមជជែកកំសាន្ត និងបន្ទប់សហគមន៍ផ្តាច់មុខ
                </p>
              </div>

              <Button
                onClick={loadProfiles}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Refresh Profiles
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MatchingFeed;
