import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

/**
 * TikTok6 Dating Cockpit
 * Premium matchmaking interface for the TikTok6 global dating platform.
 * Accessible via /dating-cockpit route.
 */

export default function TikTok6DatingCockpit() {
  const { setAuthModalOpen } = useAppContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Dating Cockpit
        </h1>
        <p className="text-slate-400 text-lg">
          Welcome to the TikTok6 Global Dating Platform. Your premium matchmaking experience awaits.
        </p>
        <button 
          onClick={() => setAuthModalOpen(true)}
          className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all"
        >
          Sign In / Register
        </button>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
          {['🇳🇬 Nigeria', '🇰🇭 Cambodia', '🇬🇭 Ghana', '🇵🇭 Philippines', '🇻🇳 Vietnam', '🌍 Global'].map((region) => (
            <div
              key={region}
              className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 text-sm text-slate-300 hover:border-pink-500/30 hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              {region}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-6 font-mono">
          🎉 Welcome Bonus: 50 NC Free Claimed for Real-Time Chat & Discovery!
        </p>
      </div>
    </div>
  );
}