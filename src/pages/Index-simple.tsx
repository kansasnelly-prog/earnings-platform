import React, { useState } from 'react';
import { 
  Zap, Shield, TrendingUp, Wallet, Users, Globe, Clock, 
  ArrowRight, Star, Menu, X, ChevronRight, Mail, Lock, User, Loader2, CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SupabaseService } from '@/services/supabaseService';

// Simple working landing page with authentication
const Index: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form states
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
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
      // Use SupabaseService.signUp() to ensure referral code generation
      const { user, error } = await SupabaseService.signUp(
        email,
        password,
        displayName,
        phoneNumber,
        null
      );
      
      if (error) {
        // If user already exists, just log them in
        if (error?.includes('already registered') || error?.includes('User already registered')) {
          // Try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) throw signInError;
          
          setUser(signInData.user);
          toast.success('Welcome back! Logged in successfully.');
          setAuthModalOpen(false);
          return;
        }
        throw error;
      }
      
      // Success - user is logged in
      setUser(user);
      toast.success('Account created and logged in!');
      setAuthModalOpen(false);
      
      // Clear form
      setEmail('');
      setPassword('');
      setDisplayName('');
      setPhoneNumber('');
    } catch (error: any) {
      toast.error('Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const features = [
    { icon: Zap, title: 'Quick Tasks', desc: 'Complete optimized tasks designed for maximum efficiency and earnings potential.', color: 'from-amber-500 to-orange-500' },
    { icon: Shield, title: 'Secure Platform', desc: 'Enterprise-grade security with encrypted transactions and verified withdrawals.', color: 'from-emerald-500 to-teal-500' },
    { icon: TrendingUp, title: 'Earn Rewards', desc: 'Progressive reward system that increases as you complete more tasks in your tier.', color: 'from-blue-500 to-indigo-500' },
    { icon: Wallet, title: 'Digital Wallet', desc: 'Bind your USDT wallet for instant withdrawals after completing your task set.', color: 'from-purple-500 to-pink-500' },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '$2.5M+', label: 'Total Paid Out', icon: TrendingUp },
    { value: '150+', label: 'Countries', icon: Globe },
    { value: '24/7', label: 'Support', icon: Clock },
  ];

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Register with your email and phone number in under 60 seconds.' },
    { step: '02', title: 'Complete Tasks', desc: 'Work through your VIP1 task set of 35 optimized assignments.' },
    { step: '03', title: 'Bind Wallet', desc: 'Connect your USDT digital wallet to receive your earnings.' },
    { step: '04', title: 'Withdraw Funds', desc: 'Request withdrawal after completing all tasks in your tier.' },
  ];

  // Dashboard component for logged-in users
  const Dashboard = () => (
    <div className="min-h-screen bg-[#060a14] text-white">
      {/* Navbar with user info */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060a14]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EARNINGSLLC
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">Welcome, {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}!</span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <Wallet className="w-8 h-8 text-indigo-400 mb-4" />
            <p className="text-sm text-slate-400">Total Earnings</p>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <CheckCircle className="w-8 h-8 text-emerald-400 mb-4" />
            <p className="text-sm text-slate-400">Tasks Completed</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <TrendingUp className="w-8 h-8 text-amber-400 mb-4" />
            <p className="text-sm text-slate-400">Current Tier</p>
            <p className="text-2xl font-bold">VIP1</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <Star className="w-8 h-8 text-purple-400 mb-4" />
            <p className="text-sm text-slate-400">Tasks Available</p>
            <p className="text-2xl font-bold">35</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
            <h3 className="text-xl font-semibold mb-2">Start Earning</h3>
            <p className="text-slate-400 mb-4">Complete your first task to start earning rewards.</p>
            <button className="px-6 py-3 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition-all">
              View Tasks
            </button>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30">
            <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
            <p className="text-slate-400 mb-4">Link your USDT wallet to receive withdrawals.</p>
            <button className="px-6 py-3 bg-emerald-600 rounded-lg font-medium hover:bg-emerald-500 transition-all">
              Add Wallet
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  // If user is logged in, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen bg-[#060a14] text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060a14]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EARNINGSLLC
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-slate-300 hover:text-white transition-colors">Pricing</a>
              <button 
                onClick={openLogin}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0f1c] border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-slate-300 hover:text-white">Features</a>
              <a href="#how-it-works" className="block text-sm text-slate-300 hover:text-white">How It Works</a>
              <a href="#pricing" className="block text-sm text-slate-300 hover:text-white">Pricing</a>
              <button 
                onClick={openLogin}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-300">Trusted by 50,000+ users worldwide</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Complete Tasks.
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Earn Rewards.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Join the leading task optimization platform. Complete simple assignments, 
              earn USDT rewards, and withdraw instantly to your digital wallet.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={openRegister}
                className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2"
              >
                Start Earning Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={openLogin}
                className="px-8 py-4 border border-white/20 rounded-xl font-semibold text-white hover:bg-white/5 transition-all"
              >
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <stat.icon className="w-6 h-6 text-indigo-400 mb-2 mx-auto" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0a0f1c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Platform Features
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to start earning from optimized task completion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Get started in minutes and begin earning rewards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-lg font-bold">
                  {step.step}
                </div>
                <div className="pt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-indigo-500">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0a0f1c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already earning rewards by completing optimized tasks. 
            Start your journey today.
          </p>
          <button 
            onClick={openRegister}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition-all inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#060a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">EARNINGSLLC</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">
                The leading task optimization platform for earning USDT rewards through simple task completion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={openLogin} className="hover:text-white">Help Center</button></li>
                <li><button onClick={openLogin} className="hover:text-white">Contact Us</button></li>
                <li><a href="/legal" className="hover:text-white">Legal</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm text-slate-400">
            © 2025 EARNINGSLLC. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0a0f1c] border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {authTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <button 
                onClick={() => setAuthModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
              <button
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  authTab === 'login' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthTab('register')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  authTab === 'register' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📱</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min 6 characters)"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}

            <button 
              onClick={() => setAuthModalOpen(false)}
              className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
