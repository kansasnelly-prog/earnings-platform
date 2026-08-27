import React, { useState } from 'react';

export const FloatingAppMinifier: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const safeOpenSocial = (url: string) => {
    // Prevents CORS/CSP iframe crashes by using native top-level window triggers
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Failed to open external link:', e);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#0a0a0c' }}>
      
      {/* Floating Control Bar */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 999999,
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: '#D4AF37',
            color: '#000',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
          }}
        >
          {isMinimized ? '👑 Expand App' : '➖ Minimize Hub'}
        </button>
      </div>

      {/* Minimized Floating Bar State */}
      {isMinimized ? (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'rgba(18, 18, 28, 0.95)',
          border: '1px solid #00FFFF',
          padding: '12px 18px',
          borderRadius: '12px',
          color: '#fff',
          zIndex: 999999,
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#00FFFF', fontSize: '13px' }}>
            ● SREYMARA MATCHING ACTIVE
          </p>
          <small style={{ color: '#94a3b8' }}>Running in background...</small>
        </div>
      ) : (
        <div>
          {/* External Social Bar (CORS Crash Safe) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 12px',
            background: '#12121c',
            borderBottom: '1px solid #333',
            overflowX: 'auto',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              SAFE SOCIALS:
            </span>
            <button onClick={() => safeOpenSocial('https://instagram.com/sreymara_official')} style={socialBtnStyle}>Instagram</button>
            <button onClick={() => safeOpenSocial('https://tiktok.com')} style={socialBtnStyle}>TikTok</button>
            <button onClick={() => safeOpenSocial('https://facebook.com')} style={socialBtnStyle}>Facebook</button>
            <button onClick={() => safeOpenSocial('https://x.com')} style={socialBtnStyle}>Twitter / X</button>
            <button onClick={() => safeOpenSocial('https://t.me/sreymara_official')} style={socialBtnStyle}>Telegram</button>
          </div>

          {/* Full Application Content */}
          {children}
        </div>
      )}
    </div>
  );
};

const socialBtnStyle: React.CSSProperties = {
  background: '#1a1a24',
  color: '#D4AF37',
  border: '1px solid #D4AF37',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
