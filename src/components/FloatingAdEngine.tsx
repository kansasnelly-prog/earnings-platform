import React, { useState } from 'react';

interface FloatingAdProps {
  boundWalletAddress?: string;
  onRecentChatsClick?: () => void;
  onPopularPeopleClick?: () => void;
}

export const FloatingAdEngine: React.FC<FloatingAdProps> = ({ 
  boundWalletAddress = "5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL",
  onRecentChatsClick,
  onPopularPeopleClick
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAdClick = async () => {
    // Fire impression / conversion yield directly to USDT/USDC/ETH multi-chain pipeline
    try {
      await fetch('/api/ads/direct-yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boundWalletAddress: boundWalletAddress,
          currencyType: 'USDT',
          cpmYield: 2.50, // $2.50 CPM
          network: 'USDT_TRC20',
          sourceTrigger: 'FLOATING_BANNER'
        })
      });
      console.log('Ad click payout executed to bound address:', boundWalletAddress);
    } catch (err) {
      console.error('Failed to log ad yield:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      width: '100%',
      background: 'linear-gradient(90deg, #0b1329 0%, #170326 100%)',
      border: '1px solid #00ffff',
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '12px',
      boxShadow: '0 0 12px rgba(0,255,255,0.3)',
      fontFamily: 'sans-serif'
    }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: '#00ffff', fontSize: '11px', fontWeight: 'bold' }}>
          PREVIOUS MESSAGE | ANONYMOUS MATCHING ACTIVE
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          ✕
        </button>
      </div>

      {/* Main Floating Banner Ad Container */}
      <div onClick={handleAdClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          background: '#ff0055',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          🔥 HOT!
        </span>
        <p style={{ color: '#00ff88', fontSize: '13px', margin: 0, fontWeight: 'bold' }}>
          AD: TIKIBLE 💜 - ANONYMOUS CHAT | DATING | TALK 
        </p>
      </div>

      <p style={{ color: '#ffffff', fontSize: '12px', margin: '4px 0 0 0' }}>
        "Hey babe 💋 Ready to meet someone cute? Join now for flirtatious anonymous chats."
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button 
          onClick={onRecentChatsClick}
          style={{
            flex: 1,
            padding: '6px',
            background: '#121a36',
            border: '1px solid #334155',
            color: '#00ffff',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          👀 RECENT CHATS 👀
        </button>
        <button 
          onClick={onPopularPeopleClick}
          style={{
            flex: 1,
            padding: '6px',
            background: '#121a36',
            border: '1px solid #334155',
            color: '#ff007f',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          POPULAR PEOPLE ❤️
        </button>
      </div>
    </div>
  );
};
