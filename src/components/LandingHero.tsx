import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Zap, Shield, TrendingUp, Wallet, CheckCircle, Users, Globe, Clock, ArrowRight, Star, Award, BarChart3, MessageCircle, ChevronDown } from 'lucide-react';

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

  const features = [
    { icon: Zap, title: 'Quick Tasks', desc: 'Complete simple tasks in minutes and earn rewards instantly', color: 'from-amber-500 to-orange-500' },
    { icon: Shield, title: 'Secure Platform', desc: 'Your data and earnings are protected with enterprise-grade security', color: 'from-emerald-500 to-teal-500' },
    { icon: TrendingUp, title: 'Earn Rewards', desc: 'Progress through VIP tiers and unlock higher earning potential', color: 'from-blue-500 to-indigo-500' },
    { icon: Wallet, title: 'Digital Wallet', desc: 'Withdraw your earnings instantly to your preferred digital wallet', color: 'from-purple-500 to-pink-500' },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '$2.5M+', label: 'Total Paid Out', icon: TrendingUp },
    { value: '150+', label: 'Countries', icon: Globe },
    { value: '24/7', label: 'Support', icon: Clock },
  ];

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Sign up in seconds and get instant access to your dashboard' },
    { step: '02', title: 'Complete Tasks', desc: 'Choose from a variety of simple tasks and complete them at your own pace' },
    { step: '03', title: 'Earn Rewards', desc: 'Get paid instantly for each completed task with transparent tracking' },
    { step: '04', title: 'Withdraw', desc: 'Cash out your earnings to your digital wallet anytime, anywhere' },
  ];

  const tiers = [
    { name: 'VIP1', tasks: 35, reward: '$2.50 - $10.00', total: '$145.00', color: 'from-indigo-500 to-blue-500', active: true },
    { name: 'VIP2', tasks: 45, reward: '$5.00 - $20.00', total: '$380.00', color: 'from-purple-500 to-pink-500', active: false },
    { name: 'VIP3', tasks: 55, reward: '$10.00 - $50.00', total: '$850.00', color: 'from-amber-500 to-orange-500', active: false },
  ];

  return (
    <div className="min-h-screen bg-[#060a14]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Top right controls - CS only */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <CSButton />
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-indigo-300 font-medium">Platform Active — 12,847 Users Online</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-white">Optimize Your</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Earnings
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of users earning through our optimized task platform. Complete your VIP tasks, bind your digital wallet, and withdraw your earnings easily.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={openRegister}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 flex items-center justify-center gap-2"
              >
                Start Earning Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={openLogin}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                Sign In to Dashboard
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="px-4 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl backdrop-blur-sm">
                  <stat.icon size={20} className="text-indigo-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Built For Earners</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to maximize your earning potential in one platform</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">Simple Steps</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                <div className="text-5xl font-black text-indigo-500/10 mb-2">{s.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 text-indigo-500/30">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Tiers */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">Earning Tiers</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">VIP Membership Levels</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Progress through tiers to unlock higher rewards and more earning opportunities.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((tier, i) => (
              <div key={i} className={`relative p-6 rounded-2xl border transition-all ${
                tier.active
                  ? 'bg-indigo-500/10 border-indigo-500/30 shadow-xl shadow-indigo-500/10'
                  : 'bg-white/[0.02] border-white/[0.06] opacity-70'
              }`}>
                {tier.active && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full">
                    AVAILABLE NOW
                  </div>
                )}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Award size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">{tier.tasks} Tasks Available</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">Reward: {tier.reward}/task</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">Total Potential: {tier.total}</span>
                  </div>
                </div>
                {tier.active ? (
                  <button onClick={openRegister} className={`w-full mt-6 py-2.5 bg-gradient-to-r ${tier.color} text-white font-semibold rounded-lg transition-all hover:opacity-90`}>
                    Get Started
                  </button>
                ) : (
                  <div className="w-full mt-6 py-2.5 bg-white/5 text-gray-500 font-semibold rounded-lg text-center text-sm">
                    Coming Soon
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Trusted by Thousands</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Alex M.', role: 'VIP1 Member', text: 'Completed all 35 tasks in just 3 days. The withdrawal process was smooth and funds arrived in my wallet within hours.' },
              { name: 'Sarah K.', role: 'VIP2 Member', text: 'The progressive reward system is brilliant. Each task feels more rewarding than the last. Already earned over $500!' },
              { name: 'David L.', role: 'VIP1 Member', text: 'Best platform I\'ve used. Clean interface, fast payouts, and the support team is incredibly responsive.' },
            ].map((t, i) => (
              <div key={i} className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 sm:p-12 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Start Earning?</h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">Join OptimizeHub today and unlock your VIP1 task set. Complete tasks, earn rewards, and withdraw to your digital wallet.</p>
              <button
                onClick={openRegister}
                className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2 mx-auto"
              >
                Create Free Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingHero;
