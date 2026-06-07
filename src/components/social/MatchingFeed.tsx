import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import './MatchingFeed.css';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [language, setLanguage] = useState('en-US');
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadUserBalance();
    parseReferralCode();

    // Safety fallback: Force loading state to false after 3 seconds
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
      setAuthLoading(false);
      console.log('Protocol 15: Loading state force-terminated by safety fallback');
    }, 3000);

    // Live time update
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(timeInterval);
    };
  }, []);

  const parseReferralCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
      console.log('Referral code saved:', refCode);
    }
  };

  const processReferralAttribution = async (userId: string) => {
    const refCode = localStorage.getItem('referral_code');
    
    if (!refCode) return;

    try {
      // Insert referral record
      const { error: referralError } = await supabase
        .from('influencer_referrals')
        .insert({
          referrer_code: refCode,
          referred_user_id: userId,
          referred_at: new Date().toISOString(),
          status: 'pending',
          coins_awarded: 0
        });

      if (referralError) throw referralError;

      // Award 5 NellyCoins as onboarding bonus
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: (userData?.balance || 0) + 5 })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // Update referral record with coins awarded
      await supabase
        .from('influencer_referrals')
        .update({ 
          status: 'completed',
          coins_awarded: 5 
        })
        .eq('referred_user_id', userId);

      // Clear referral code from localStorage
      localStorage.removeItem('referral_code');
      
      console.log('Referral processed successfully');
    } catch (error) {
      console.error('Error processing referral:', error);
      // Fallback: Clear referral code to prevent retry loops
      localStorage.removeItem('referral_code');
    }
  };

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
      // Fallback: Set empty profiles to prevent infinite loading
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Process referral attribution if user has a referral code
      await processReferralAttribution(user.id);

      const { data, error } = await supabase
        .from('users')
        .select('balance, account_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setNellyCoins(data?.balance || 0);

      // Force loading state termination for admin sessions
      if (data?.account_type === 'admin') {
        setLoading(false);
        setAuthLoading(false);
        console.log('Protocol 15: Admin session detected - loading state terminated');
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      // Fallback: Set balance to 0 to prevent UI hang
      setNellyCoins(0);
      // Force loading state termination on error
      setLoading(false);
      setAuthLoading(false);
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

  const handleTaskHubBypass = async () => {
    // Admin bypass - force loading termination and redirect to dashboard
    setLoading(false);
    setAuthLoading(false);
    console.log('Protocol 15: Task Hub admin bypass triggered - loading terminated');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user is admin
        const { data } = await supabase
          .from('users')
          .select('account_type')
          .eq('id', user.id)
          .single();
        
        if (data?.account_type === 'admin') {
          toast({
            title: "Admin Access Granted",
            description: "Redirecting to Task Hub dashboard...",
            variant: "default",
          });
          // Redirect to admin dashboard
          window.location.href = '/admin';
        } else {
          toast({
            title: "Access Denied",
            description: "Task Hub is reserved for admin accounts only.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Authentication Required",
          description: "Please log in first to access Task Hub.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Task Hub bypass error:', error);
      toast({
        title: "Bypass Failed",
        description: "Unable to verify admin credentials.",
        variant: "destructive",
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
          variant: "default",
        });

        // Process referral if exists
        if (data.user) {
          await processReferralAttribution(data.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login Successful",
          description: "Welcome back to Nelly Social Hub!",
          variant: "default",
        });

        // Process referral if exists
        if (data.user) {
          await processReferralAttribution(data.user.id);
        }

        // Reload profiles and balance after successful auth
        loadProfiles();
        loadUserBalance();

        // Force loading state termination after successful authentication
        setLoading(false);
        console.log('Protocol 15: Authentication successful - loading state terminated');
      }

      // Clear form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: isSignup ? "Registration Failed" : "Login Failed",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
      // Force loading state termination on auth error
      setLoading(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di0yaDJ2MmgtMnptMC0zaDJ2MmgtMnYtMnptMC0zaDJ2MmgtMnYtMnptLTQgMGgydjJoLTJ2LTJ6bTAtM2gydjJoLTJ2LTJ6bTAtM2gydjJoLTJ2LTJ6bS00IDBoMnYyaC0ydi0yem0wLTNoMnYyaC0ydi0yem0wLTNoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 animate-pulse-slow"></div>
        <div className="relative z-10 text-white text-xl font-bold animate-glow">Loading profiles...</div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di0yaDJ2MmgtMnptMC0zaDJ2MmgtMnYtMnptMC0zaDJ2MmgtMnYtMnptLTQgMGgydjJoLTJ2LTJ6bTAtM2gydjJoLTJ2LTJ6bTAtM2gydjJoLTJ2LTJ6bS00IDBoMnYyaC0ydi0yem0wLTNoMnYyaC0ydi0yem0wLTNoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      
      {/* TikTok6 Network Official Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay" style={{ opacity: 0.05 }}>
        <div className="text-center transform -rotate-12">
          <h1 className="text-8xl md:text-9xl font-black text-white tracking-wider" style={{ 
            textShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.2em'
          }}>
            TIKTOK6
          </h1>
          <p className="text-3xl md:text-4xl font-bold text-white tracking-widest mt-4" style={{ letterSpacing: '0.3em' }}>
            NETWORK OFFICIAL
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto p-4 md:p-8">
        {/* Top Header with Spinning Music Note and Live Time */}
        <div className="flex items-center justify-between mb-8">
          {/* Left: Spinning Music Note with 6 Badge */}
          <div className="flex items-center gap-4">
            <div className="relative animate-spin-header-note">
              <div className="text-5xl md:text-6xl font-black relative" style={{
                background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 25%, #a8a8a8 50%, #d4d4d4 75%, #b8b8b8 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(-2px 0 0 rgba(0, 255, 255, 0.6)) drop-shadow(2px 0 0 rgba(255, 0, 255, 0.6))'
              }}>
                ♪
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                6
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white animate-glow">TikTok6</h1>
          </div>

          {/* Right: Live Time/Date Telemetry */}
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-bold text-amber-400 animate-glow">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-amber-200">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - TikTok6 Authentication Console */}
          <div className="space-y-6">
            {/* TikTok6 Login Card */}
            <Card className="backdrop-blur-xl border-2 border-amber-500/30 shadow-2xl bg-gradient-to-br from-slate-900/95 to-black/95">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center animate-glow">Log in to TikTok6</h2>
                
                {/* 6 Button Panels */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-amber-500/50 transition-all duration-300"
                  >
                    Use QR code
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-amber-500/50 transition-all duration-300"
                    onClick={() => setShowEmailForm(!showEmailForm)}
                  >
                    Use phone / email / username
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300"
                  >
                    Continue with Facebook
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-red-500/50 transition-all duration-300"
                  >
                    Continue with Google
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-green-500/50 transition-all duration-300"
                  >
                    Continue with LINE
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/20 transition-all duration-300 font-bold"
                    onClick={handleTaskHubBypass}
                  >
                    Continue with Task Hub
                  </Button>
                </div>

                {/* Email/Password Form (Expandable) */}
                {showEmailForm && (
                  <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-amber-400 font-bold mb-2 animate-glow text-sm">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full bg-slate-900/80 backdrop-blur-sm border-2 border-amber-500/50 rounded-lg px-4 py-3 text-amber-400 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-400 font-bold mb-2 animate-glow text-sm">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full bg-slate-900/80 backdrop-blur-sm border-2 border-amber-500/50 rounded-lg px-4 py-3 text-amber-400 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all duration-300"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-amber-500/50"
                    >
                      {authLoading ? 'Processing...' : isSignup ? '✨ Create Account' : '🔐 Log In'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setIsSignup(!isSignup)}
                      className="w-full text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all duration-300 animate-glow"
                    >
                      {isSignup ? 'Already have an account? Log In' : 'New user? Create Account'}
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Speed Match Button */}
            <Button
              onClick={handleSpeedMatch}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-4 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/50"
            >
              ⚡ Speed Match (10 NC)
            </Button>

            {/* Profile Cards */}
            {currentProfile ? (
              <Card className="backdrop-blur-xl border-2 border-pink-500/30 shadow-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40">
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
              <Card className="backdrop-blur-xl border-2 border-pink-500/30 shadow-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="relative inline-block mb-4">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-600 p-1 animate-spin-slow shadow-lg shadow-amber-500/50">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center overflow-hidden">
                          <div className="text-6xl">💑</div>
                        </div>
                      </div>
                      <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-amber-400/50 animate-pulse"></div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 animate-glow">Create Your Dating Profile</h2>
                    <p className="text-amber-300 text-lg mb-4 animate-glow">Log In to Nelly Social Hub</p>
                  </div>
                  
                  <Button
                    onClick={loadProfiles}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white relative overflow-hidden"
                  >
                    {buttonLoading === 'refresh' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      'Refresh Profiles'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Description Text Cards */}
          <div className="space-y-6">
            <Card className="backdrop-blur-xl border-2 border-amber-500/30 shadow-2xl bg-gradient-to-br from-purple-950/85 to-pink-950/90 h-full">
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-purple-950/85 to-pink-950/90 backdrop-blur-xl border-2 border-amber-500/40 rounded-xl p-6 shadow-2xl shadow-amber-500/20">
                  <p className="text-amber-100 text-lg leading-relaxed animate-glow">
                    Welcome to the ultimate connection experience. Dive into high-definition Local Video Reels 🎬, experience real-time Interactive Live Streams 📡, flirt 🫦, and fall in love 💕 with premium singles and global travelers. Join community exclusive rooms, private group chats, and timed voice match channels engineered for real connection.
                  </p>
                  <p className="text-amber-300 text-sm mt-4 leading-relaxed animate-glow">
                    សូមស្វាគមន៍មកកាន់បទពិសោធន៍នៃការតភ្ជាប់ដ៏ល្អឥតខ្ចោះ។ ចូលរួមទស្សនាវីដេអូខ្លីៗកម្រិតច្បាស់ (Video Reels) 🎬, បទពិសោធន៍នៃការផ្សាយផ្ទាល់រំភើបៗ (Interactive Live Streams) 📡, ចែចង់ 🫦 និងលង់ស្រឡាញ់ 💕 ជាមួយអ្នកនៅលីវលំដាប់ប្រណីត និងអ្នកធ្វើដំណើរជុំវិញពិភពលោក។ ចូលរួមបន្ទប់សហគមន៍ផ្តាច់មុខ ក្រុមជជែកកំសាន្តឯកជន និងឆានែលផ្គូផ្គងសំឡេងដែលមានម៉ោងកំណត់ត្រូវបានរចនាឡើងសម្រាប់ការតភ្ជាប់ពិតប្រាកដ។
                  </p>
                  
                  {/* TikTok6 3D Rotating Corporate Emblem */}
                  <div className="mt-8 flex items-center justify-center" style={{ width: '100%', minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="relative flex flex-col items-center justify-center">
                      {/* Upper Note Layer - Spinning Musical Note */}
                      <div className="relative mb-6 animate-spin-note">
                        <div className="relative">
                          {/* Musical Note Symbol with Brushed Silver Finish */}
                          <div className="text-8xl md:text-9xl font-black relative" style={{
                            background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 25%, #a8a8a8 50%, #d4d4d4 75%, #b8b8b8 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                            filter: 'drop-shadow(-3px 0 0 rgba(0, 255, 255, 0.8)) drop-shadow(3px 0 0 rgba(255, 0, 255, 0.8))',
                            textShadow: 'none'
                          }}>
                            ♪
                          </div>
                          {/* 3D Chromatic Offsets */}
                          <div className="absolute top-0 left-0 text-8xl md:text-9xl font-black opacity-50" style={{
                            color: 'rgba(0, 255, 255, 0.6)',
                            transform: 'translateX(-4px)',
                            filter: 'blur(1px)'
                          }}>
                            ♪
                          </div>
                          <div className="absolute top-0 left-0 text-8xl md:text-9xl font-black opacity-50" style={{
                            color: 'rgba(255, 0, 255, 0.6)',
                            transform: 'translateX(4px)',
                            filter: 'blur(1px)'
                          }}>
                            ♪
                          </div>
                        </div>
                      </div>

                      {/* Lower Text Layer - Metallic Gold TikTok6 */}
                      <div className="relative">
                        <h2 className="text-5xl md:text-6xl font-black animate-glow" style={{
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffec8b 25%, #daa520 50%, #f0e68c 75%, #b8860b 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          textShadow: '0 4px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.5)',
                          letterSpacing: '0.05em',
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))'
                        }}>
                          TikTok6
                        </h2>
                        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full blur-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Language Selector Dock */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/95 to-black/95 backdrop-blur-xl border-t border-amber-500/30 p-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-amber-400 font-bold text-lg cursor-pointer hover:text-amber-300 transition-colors">
                KHMER
              </div>
              <div className="h-6 w-px bg-amber-500/30"></div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900/80 border border-amber-500/50 rounded-lg px-4 py-2 text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all duration-300"
              >
                <option value="en-US">English (US)</option>
                <option value="km-KH">ខ្មែរ (KH)</option>
                <option value="zh-CN">中文 (CN)</option>
                <option value="ja-JP">日本語 (JP)</option>
                <option value="ko-KR">한국어 (KR)</option>
              </select>
            </div>
            <div className="text-amber-400/60 text-sm">
              © 2026 TikTok6 Network. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingFeed;
