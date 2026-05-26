import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { X, Mail, Phone, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, authModalTab, setAuthModalTab, login, register, authLoading } = useAppContext();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (authModalTab === 'register') {
      if (!displayName.trim()) errs.displayName = 'Display name is required';
      if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSubmitError(null);
    
    const isValid = validate();
    if (!isValid) {
      return;
    }
    
    if (authModalTab === 'login') {
      const result = await login(email, password);
      if (!result.success) {
        setSubmitError(result.error || 'Login failed');
      } else {
        resetForm();
        setAuthModalOpen(false);
      }
    } else {
      const result = await register(email, password, displayName, phone);
      if (!result.success) {
        const errorMessage = result.error || 'Registration failed';
        if (/already registered|already exists|user already/i.test(errorMessage)) {
          setAuthModalTab('login');
          setSubmitError('Account already exists. Please log in with this email.');
          return;
        }
        setSubmitError(errorMessage);
      } else {
        resetForm();
        setAuthModalOpen(false);
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setErrors({});
    setSubmitError(null);
    setShowPassword(false);
  };

  const switchTab = (tab: 'login' | 'register') => {
    setAuthModalTab(tab);
    resetForm();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={() => setAuthModalOpen(false)}
    >
      <div 
        className="relative w-full max-w-md bg-[#0f1629] border border-indigo-500/20 rounded-2xl shadow-2xl shadow-indigo-500/10 mt-36 mb-4 mx-4" 
        onClick={e => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">OptimizeHub</h2>
              <p className="text-white/70 text-sm">{authModalTab === 'login' ? 'Welcome back' : 'Create your account'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-indigo-500/20" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => switchTab('login')}
            type="button"
            className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer select-none ${
              authModalTab === 'login' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            Sign In
          </button>
          <button
            onClick={() => switchTab('register')}
            type="button"
            className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer select-none ${
              authModalTab === 'register' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4" style={{ pointerEvents: 'auto' }}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {authModalTab === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter your name"
                  required
                />
                {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-2.5 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {authModalTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
          >
            {authLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Processing...</>
            ) : (
              authModalTab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400 text-center font-mono break-words">{submitError}</p>
              <p className="text-xs text-red-300 text-center mt-1">Check browser console for full details</p>
            </div>
          )}

          {authModalTab === 'register' && (
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
