import React, { useState } from 'react';
import { 
  Zap, Shield, TrendingUp, Wallet, Users, Globe, Clock, 
  ArrowRight, Star, Menu, X, ChevronRight, Mail, Lock, User, Loader2, CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SupabaseService } from '@/services/supabaseService';

// Optimized Landing Page Gate for EARNINGSLLC
const Index: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const openLogin = () => { setAuthTab('login'); setAuthModalOpen(true); };
  const openRegister = () => { setAuthTab('register'); setAuthModalOpen(true); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      toast.success('Login successful!');
      setAuthModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { user, error } = await SupabaseService.signUp(email, password, displayName, phoneNumber, null);
      if (error) {
        if (error?.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          setUser(signInData.user);
          toast.success('Welcome back!');
          setAuthModalOpen(false);
          return;
        }
        throw error;
      }
      setUser(user);
      toast.success('Account created!');
      setAuthModalOpen(false);
    } catch (error: any) {
      toast.error('Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out');
  };

  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '$2.5M+', label: 'Total Paid Out', icon: TrendingUp },
    { value: '150+', label: 'Countries', icon: Globe },
    { value: '24/7', label: 'Support', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              EARNINGSLLC
            </span>
          </div>
          <button onClick={openLogin} className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-all">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section - iPhone 17 Pro Max Aesthetic */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_60%)]" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">OPTIMIZE</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">YOUR INCOME</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            The world's most advanced task platform, reimagined for maximum efficiency.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={openRegister} className="px-10 py-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
              Start Earning
            </button>
          </div>
        </div>
      </section>
      
      {/* Stats - Shiny Modern Aesthetic */}
      <section className="py-20 border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
              <stat.icon className="w-8 h-8 text-indigo-400 mb-4 mx-auto" />
              <div className="text-4xl font-bold mb-1 text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Auth Modal (Simplified) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm p-8 rounded-3xl bg-[#0a0a0a] border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-center">{authTab === 'login' ? 'Login' : 'Register'}</h2>
            <form onSubmit={authTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {authTab === 'register' && (
                <>
                  <input type="text" placeholder="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10" required />
                  <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10" required />
                </>
              )}
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10" required />
              <button type="submit" className="w-full p-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (authTab === 'login' ? 'Login' : 'Create Account')}
              </button>
            </form>
            <button onClick={() => setAuthModalOpen(false)} className="w-full mt-4 text-gray-400">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
