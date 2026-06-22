import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

/**
 * TikTok6 Global Soulmate & Matchmaking Hub
 * Path: /soulmate
 * Premium matchmaking interface with neon-vortex visuals.
 */

export default function TikTok6SoulmateHub() {
  const [activeTab, setActiveTab] = useState<'match' | 'community'>('match');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const { user } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', user?.id).single();
    if (data) setBalance(data.balance);
  };

  const startCountdown = () => {
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTransaction = async () => {
    const { error } = await supabase.from('profiles').update({ balance: balance + 5 }).eq('id', user?.id);
    if (!error) {
      setBalance(balance + 5);
      alert('Virtual Gift Sent! +5 NC added to pool.');
    }
  };

  const communityLinks: Record<string, string> = {
    'Nigeria': 'https://t.me/nigeria_connect',
    'Cambodia': 'https://t.me/cambodia_discovery',
    'Ghana': 'https://t.me/ghana_social',
    'Philippines': 'https://t.me/philippines_network',
    'Vietnam': 'https://t.me/vietnam_circle',
    'US': 'https://t.me/us_global',
    'Germany': 'https://t.me/germany_social',
    'Australia': 'https://t.me/australia_network'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-pink-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <div className="mb-4 text-right">
          <span className="text-sm text-slate-400">NC Coins Pool: </span>
          <span className="font-bold text-pink-500">{balance} NC</span>
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/50 mb-8 backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab('match')}
            className={`flex-1 py-3 font-bold rounded-xl transition-all ${activeTab === 'match' ? 'bg-pink-600 shadow-lg shadow-pink-900/50' : 'hover:bg-slate-800'}`}
          >
            ❤️ Soul Mate Matcher
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-3 font-bold rounded-xl transition-all ${activeTab === 'community' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800'}`}
          >
            🌍 Global Communities
          </button>
        </div>

        {activeTab === 'match' ? (
          <div className="flex flex-col items-center justify-center py-12">
            {countdown !== null && countdown > 0 ? (
              <div className="text-[150px] font-black text-pink-500 animate-pulse">
                {countdown}
              </div>
            ) : countdown === 0 ? (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6">Top 10 Matches Found!</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-pink-500 transition-all text-center">
                      <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-2" />
                      <div className="text-sm font-bold">User {i + 1}</div>
                      <div className="text-xs text-slate-400">89% Match</div>
                      <button 
                        onClick={handleTransaction}
                        className="mt-2 text-xs bg-pink-600 px-2 py-1 rounded hover:bg-pink-500"
                      >
                        Unlock Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button 
                onClick={startCountdown}
                className="w-48 h-48 bg-pink-600 rounded-full flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(219,39,119,0.5)] hover:scale-105 transition-transform animate-pulse"
              >
                ❤️
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(communityLinks).map((country) => (
              <div key={country} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all text-center">
                <div className="text-3xl mb-2">🌍</div>
                <div className="font-bold mb-3">{country}</div>
                <a 
                  href={communityLinks[country]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full py-2 border border-indigo-500 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all font-bold"
                >
                  Join Group
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
