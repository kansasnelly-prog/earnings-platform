import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Zap, Shield, TrendingUp, Wallet, CheckCircle, Users, Globe, Clock, ArrowRight, Star, Award, MessageCircle, Music } from 'lucide-react';

// Customer Service button component
const CSButton: React.FC = () => {
  return (
    <a 
      href="https://t.me/EARNINGSLLCONLINECS1" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-lg shadow-pink-500/25"
    >
      <MessageCircle size={16} />
      <span>CS</span>
    </a>
  );
};

const LandingHero: React.FC = () => {
  const { setAuthModalOpen, setAuthModalTab } = useAppContext();

  const openRegister = () => { setAuthModalTab('register'); setAuthModalOpen(true); };
  const openLogin = () => { setAuthModalTab('login'); setAuthModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#060a14]">
      {/* Upper Left: Spinning 4D Music Banner */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-3 rounded-2xl border border-indigo-500/30 flex items-center gap-3 shadow-2xl">
          <div className="animate-spin-slow">
            <Music size={24} className="text-white fill-white" />
          </div>
          <span className="text-white font-black tracking-widest text-lg">TIKTOK6</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <CSButton />
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            {/* Center Stage: Stunning Branding Refactor */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-pink-400 to-blue-400 animate-pulse">
                TIKTOK6
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              The premier platform for optimized digital engagement and reward accrual.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={openRegister}
                className="group w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-full transition-all hover:scale-105"
              >
                JOIN THE REVOLUTION
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lower Viewport: Heavenly Lovers Modal */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-4xl animate-bounce">👦</div>
          <div className="text-4xl animate-pulse text-red-500">❤️</div>
          <div className="text-4xl animate-bounce">👧</div>
        </div>
        <p className="text-gray-500 text-sm">© 2026 TikTok6 Ecosystem. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default LandingHero;
