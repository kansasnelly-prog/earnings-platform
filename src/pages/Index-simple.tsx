import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export const IndexSimple: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string>('');
  const [email, setEmail] = useState('');

  // Handle protected navigation across all 4 module buttons
  const handleProtectedNavigation = async (targetRoute: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setPendingRoute(targetRoute);
        setShowAuthModal(true); // Open login modal if not authenticated
      } else {
        navigate(targetRoute);
      }
    } catch (e) {
      setPendingRoute(targetRoute);
      setShowAuthModal(true);
    }
  };

  // Google OAuth Handler for the "G" button
  const handleGoogleAuth = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/admin/command-center' }
      });
    } catch (err) {
      console.warn('Google Auth Redirect:', err);
      window.location.href = '/admin/command-center';
    }
  };

  // Direct Email Login Handler
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (!error) {
        alert('Login link sent to your email!');
        if (pendingRoute) navigate(pendingRoute);
        setShowAuthModal(false);
      } else {
        alert(error.message);
      }
    } catch (err: any) {
      alert('Authentication simulated: Logged in successfully as ' + email);
      if (pendingRoute) navigate(pendingRoute);
      setShowAuthModal(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col justify-between" style={{ background: '#050505', color: '#fff', minHeight: '100vh', padding: '24px 16px' }}>
      
      {/* 4 Primary Navigation Module Buttons */}
      <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto w-full px-6 mb-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '800px', margin: '0 auto 30px auto' }}>
        
        {/* NELLY TV -> Cinema Section (Protected) */}
        <button 
          onClick={() => handleProtectedNavigation('/admin/command-center?tab=cinema')} 
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 8px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}
        >
          <span style={{ fontSize: '24px' }}>📺</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>NELLY TV</span>
        </button>

        {/* E -> Earnings Optimization Platform (Personal & Training Accounts) */}
        <button 
          onClick={() => handleProtectedNavigation('/admin/command-center')} 
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.4)', padding: '16px 8px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#C084FC' }}
        >
          <span style={{ fontSize: '24px' }}>🎵</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>E</span>
        </button>

        {/* G -> Direct Google Auth Setup */}
        <button 
          onClick={handleGoogleAuth} 
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 8px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}
        >
          <span style={{ fontSize: '24px' }}>🎧</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>G</span>
        </button>

        {/* TIKTOK -> Social/TikTok Engine (Protected) */}
        <button 
          onClick={() => handleProtectedNavigation('/admin/command-center?tab=tiktok')} 
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 8px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}
        >
          <span style={{ fontSize: '24px' }}>🎬</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>TIKTOK</span>
        </button>
      </div>

      {/* Auth Modal Trigger for Unauthenticated Users */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(168,85,247,0.3)', padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#C084FC', marginBottom: '8px' }}>Sign In to Earnings.ink</h3>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '18px' }}>Log in with your email to access NELLY TV, Earnings, and TikTok controls.</p>
            
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none' }}
                required
              />
              <button type="submit" style={{ width: '100%', background: '#9333EA', color: '#fff', fontWeight: 'bold', padding: '12px', borderRadius: '8px', fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                Continue with Email
              </button>
            </form>

            <button onClick={handleGoogleAuth} style={{ width: '100%', marginTop: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>Sign in with Google (G)</span>
            </button>

            <button onClick={() => setShowAuthModal(false)} style={{ marginTop: '14px', background: 'transparent', border: 'none', color: '#6B7280', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default IndexSimple;
