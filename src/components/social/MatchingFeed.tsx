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
  }, []);

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
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="text-yellow-400 font-bold">{nellyCoins}</span>
            <span className="text-white text-sm ml-1">NC</span>
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
          <Card className="backdrop-blur-xl border-2 border-pink-500/30">
            <CardContent className="p-6 text-center">
              <p className="text-white text-xl mb-4">No more profiles</p>
              <Button
                onClick={loadProfiles}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MatchingFeed;
