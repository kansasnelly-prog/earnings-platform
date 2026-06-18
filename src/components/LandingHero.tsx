import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const LandingHero: React.FC = () => {
  const { setAuthModalOpen, setAuthModalTab } = useAppContext();

  const openRegister = () => { setAuthModalTab('register'); setAuthModalOpen(true); };
  const openLogin = () => { setAuthModalTab('login'); setAuthModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#060a14] text-white flex flex-col items-center justify-center p-6 text-center">
      {/* Online Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-300 text-xs font-semibold tracking-wider uppercase">
            • Platform Active — 12,847 users online
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Optimize Your Digital Earnings
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl font-light leading-relaxed">
        Join thousands of users earning through our optimized task platform. Complete your VIP tier tasks, bind your digital wallet, and withdraw your earnings seamlessly.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={openRegister}
          className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all text-lg"
        >
          Start Earning Now →
        </button>
        <button
          onClick={openLogin}
          className="px-8 py-4 bg-transparent border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-bold rounded-lg transition-all text-lg"
        >
          Sign In to Dashboard
        </button>
      </div>
    </div>
  );
};

export default LandingHero;
