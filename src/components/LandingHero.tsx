import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Music, MessageCircle, Star, Sparkles, Heart } from 'lucide-react';

const CSButton: React.FC = () => {
  return (
    <a 
      href="https://t.me/EARNINGSLLCONLINECS1" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold hover:scale-105 transition-all duration-300 shadow-xl shadow-pink-500/20"
    >
      <MessageCircle size={18} />
      <span>CS SUPPORT</span>
    </a>
  );
};

const LandingHero: React.FC = () => {
  const { setAuthModalOpen, setAuthModalTab } = useAppContext();

  const openRegister = () => { setAuthModalTab('register'); setAuthModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500/30">
      {/* Premium Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-3 rounded-2xl border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-2xl">
          <div className="animate-spin-slow">
            <Music size={24} className="text-white fill-white" />
          </div>
          <span className="text-white font-black tracking-widest text-lg">TIKTOK6</span>
        </div>
        <CSButton />
      </div>

      {/* Hero Section - iPhone 17 Pro Max Aesthetic */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(236,72,153,0.15),transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wider">NEW DATING COCKPIT 🎯</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-500">
              TIKTOK6
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-16 max-w-xl mx-auto font-light leading-relaxed">
            Experience the future of social connectivity. Advanced matching, premium discovery, and 4D engagement.
          </p>

          <button
            onClick={openRegister}
            className="group px-12 py-6 bg-white text-black font-black text-xl rounded-full transition-all hover:scale-105 hover:bg-gray-100 shadow-2xl shadow-white/10"
          >
            ENTER THE COCKPIT
          </button>
        </div>
      </section>

      {/* Footer - Spiritual Anchor */}
      <footer className="py-20 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-6 mb-8">
          <Heart className="w-10 h-10 text-pink-500 animate-pulse" fill="currentColor" />
        </div>
        <p className="text-gray-600 text-sm font-medium">TIKTOK6 NETWORK OFFICIAL • 2026</p>
      </footer>
    </div>
  );
};

export default LandingHero;
