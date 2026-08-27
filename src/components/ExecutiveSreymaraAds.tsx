import React, { useState } from 'react';

interface ExecutiveAdsProps {
  boundWalletAddress?: string;
}

export const ExecutiveSreymaraAds: React.FC<ExecutiveAdsProps> = ({ 
  boundWalletAddress = "5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL" 
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const triggerAdYield = async () => {
    if (!boundWalletAddress) return;
    try {
      await fetch('/api/ads/direct-yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boundWalletAddress,
          currencyType: 'USDT',
          cpmYield: 3.50, // $3.50 CPM payout
          network: 'DIRECT_MULTI_CHAIN'
        })
      });
      console.log('[EXECUTIVE SREYMARA ADS] Yield logged to bound wallet.');
    } catch (err) {
      console.error('[ADS ERROR]', err);
    }
  };

  if (isDismissed) return null;

  return (
    <div style={{ width: '100%', fontFamily: 'sans-serif', marginBottom: '8px' }}>
      
      {/* Top Pinned Message Bar */}
      <div style={{
        background: '#0d1527',
        borderLeft: '3px solid #00ffff',
        padding: '6px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginRight: '6px' }}>
          <span style={{ color: '#00ffff', fontSize: '10px', fontWeight: 'bold', display: 'block' }}>
            PINNED MESSAGE
          </span>
          <span style={{ color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}>
            WANT TO START AN ANONYMOUS CHAT? 🕶️ TAP 🎲 RANDOM MATCH...
          </span>
        </div>
        <button style={{
          background: 'linear-gradient(90deg, #00b0ff, #00ff88)',
          border: 'none',
          borderRadius: '16px',
          color: '#000',
          padding: '4px 10px',
          fontWeight: 'bold',
          fontSize: '11px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          🎲 START RANDOM
        </button>
      </div>

      {/* Floating Banner: EXECUTIVE SREMYARA ADS */}
      <div 
        onClick={triggerAdYield}
        style={{
          background: 'linear-gradient(180deg, #101426 0%, #0a0c16 100%)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '6px',
          padding: '8px 12px',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }}
      >
        <div style={{ flex: 1, paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ background: '#00b0ff', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>
              AD
            </span>
            <span style={{ color: '#00ff88', fontSize: '13px', fontWeight: 'bold' }}>
              EXECUTIVE SREYMARA ADS 💕 - CHAT | DATING
            </span>
            <span style={{ color: '#666', fontSize: '10px' }}>WHAT'S THIS?</span>
          </div>

          <p style={{ color: '#00ff88', fontSize: '12px', margin: 0, fontWeight: 'bold', lineHeight: '1.3' }}>
            😮 TIRED OF HAVING NO ONE TO CHAT WITH? 😮 COME JOIN SREYMARA SUITE — ALL THE COOL GUYS AND GIRLS ARE HERE 🤗🔥 IT'S FREE AS WELL 👌🤩
          </p>
        </div>

        {/* Logo / Thumbnail Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
            style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer' }}
          >
            ✕
          </button>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '6px',
            background: 'linear-gradient(45deg, #ff007f, #00ffff)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px'
          }}>
            👑
          </div>
        </div>
      </div>

    </div>
  );
};
