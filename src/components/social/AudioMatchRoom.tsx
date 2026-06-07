import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';

const AudioMatchRoom: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(420); // 7 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [soulCardsRevealed, setSoulCardsRevealed] = useState(0);
  const [nellyCoins, setNellyCoins] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    loadUserBalance();
  }, []);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartMatch = () => {
    setIsActive(true);
  };

  const handleEndMatch = () => {
    setIsActive(false);
    setTimeLeft(420);
  };

  const handleRevealSoulCard = async () => {
    if (nellyCoins < 5) {
      alert('Insufficient NellyCoins. You need 5 NellyCoins to reveal a Soul Card.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ balance: nellyCoins - 5 })
        .eq('id', user.id);

      if (error) throw error;

      setNellyCoins(nellyCoins - 5);
      setSoulCardsRevealed(soulCardsRevealed + 1);
      alert('Soul Card revealed! 5 NellyCoins deducted.');
    } catch (error) {
      console.error('Error revealing Soul Card:', error);
      alert('Failed to reveal Soul Card. Please try again.');
    }
  };

  const progressPercentage = ((420 - timeLeft) / 420) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-purple-900 to-cyan-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Voice Match</h1>
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

        {/* Timer Card */}
        <Card
          className="backdrop-blur-xl border-2 border-cyan-500/30 mb-4"
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
          }}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-cyan-400 mb-4 font-mono">
                {formatTime(timeLeft)}
              </div>
              <div className="w-full h-3 bg-cyan-900 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex gap-4 justify-center">
                {!isActive ? (
                  <Button
                    onClick={handleStartMatch}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    🎤 Start Match
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndMatch}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300"
                  >
                    ⏹️ End Match
                  </Button>
                )}
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  {isMuted ? '🔇' : '🔊'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soul Cards Section */}
        <Card
          className="backdrop-blur-xl border-2 border-purple-500/30 mb-4"
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
          }}
        >
          <CardHeader>
            <CardTitle className="text-purple-400 text-xl">🎴 Soul Cards Revealed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-2xl font-bold">{soulCardsRevealed}</span>
              <Button
                onClick={handleRevealSoulCard}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-300"
              >
                Reveal Card (5 NC)
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-2xl ${
                    i < soulCardsRevealed
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-white/10'
                  }`}
                >
                  {i < soulCardsRevealed ? '🌟' : '?'}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Match Status */}
        <Card
          className="backdrop-blur-xl border-2 border-green-500/30"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-white">
                {isActive ? 'Match in Progress' : 'Waiting to Start'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioMatchRoom;
