import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';

const TikTok6RegistrationGate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName) {
          setErrorMsg('Please enter your full name');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              display_name: fullName,
            }
          }
        });
        if (error) throw error;
        setSuccessMsg('Registration successful! Please check your email for verification.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden p-4 md:p-8 flex items-center justify-center relative">
      <style>{`
        @keyframes blink-glow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(236, 72, 153, 0.8), 0 0 50px rgba(147, 51, 234, 0.5);
            border-color: rgba(236, 72, 153, 1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.3), 0 0 20px rgba(147, 51, 234, 0.2);
            border-color: rgba(147, 51, 234, 0.5);
            transform: scale(0.995);
          }
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-blink-glow {
          animation: blink-glow 2.5s infinite ease-in-out;
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 4s linear infinite;
        }
      `}</style>

      {/* Decorative ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.15),_transparent_75%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Shining/Blinking Image Card & Value Proposition */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl animate-bounce">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-text-shine">
                TIKTOK6 GLOBAL
              </h1>
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-purple-400">
                Beyond Connection • Matchmaking Universe
              </p>
            </div>
          </div>

          {/* High-Attention Embedded Reference Design File */}
          <div className="relative rounded-3xl overflow-hidden border-2 animate-blink-glow bg-neutral-950/80 p-2 transition-all duration-500">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center">
              <img 
                src="/designs/tiktok6-registration-reference.png.jpg" 
                alt="TikTok6 Registration Design Reference" 
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
                <span className="self-start px-3 py-1 bg-pink-500/90 text-white text-xs font-black rounded-full uppercase tracking-wider mb-2 animate-pulse">
                  Exclusive Discovery Hub
                </span>
                <p className="text-lg md:text-xl font-bold text-white drop-shadow-md">
                  Vietnam • Cambodia • Nigeria • Philippines • Ghana
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-neutral-900/60 rounded-2xl border border-neutral-800">
              <p className="text-lg md:text-xl font-black text-pink-500">50 NC</p>
              <p className="text-[10px] uppercase text-neutral-400 tracking-wider">Welcome Gift</p>
            </div>
            <div className="p-3 bg-neutral-900/60 rounded-2xl border border-neutral-800">
              <p className="text-lg md:text-xl font-black text-purple-500">100%</p>
              <p className="text-[10px] uppercase text-neutral-400 tracking-wider">Real Profiles</p>
            </div>
            <div className="p-3 bg-neutral-900/60 rounded-2xl border border-neutral-800">
              <p className="text-lg md:text-xl font-black text-cyan-500">Real-Time</p>
              <p className="text-[10px] uppercase text-neutral-400 tracking-wider">Translation</p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Authentication Form */}
        <div className="lg:col-span-5 bg-neutral-900/90 p-6 md:p-8 rounded-3xl border border-neutral-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs md:text-sm text-neutral-400">
              {isSignUp ? 'Sign up now to claim your 50 NC bonus!' : 'Log in to continue your global discovery'}
            </p>
          </div>

          {/* Error and Success Banners */}
          {errorMsg && (
            <div className="p-3 mb-4 bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-semibold rounded-xl text-center">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-4 bg-green-950/80 border border-green-800/80 text-green-400 text-xs font-semibold rounded-xl text-center animate-pulse">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-neutral-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => alert('Password recovery is managed via secure platform administrator.')}
                    className="text-[10px] text-pink-500 font-bold hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold py-6 rounded-xl text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-pink-500/20 active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-current" />
                  {isSignUp ? 'Claim Bonus & Register' : 'Access Match-Feed'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-800 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs font-bold text-neutral-400 hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account? <span className="text-pink-500 hover:underline">Log In</span>
                </>
              ) : (
                <>
                  Don't have an account? <span className="text-pink-500 hover:underline">Register Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Banner */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none hidden md:block">
        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
          Secured with Supabase Database Auth Shield • Powered by KANSAS NELLY
        </p>
      </div>
    </div>
  );
};

export default TikTok6RegistrationGate;
