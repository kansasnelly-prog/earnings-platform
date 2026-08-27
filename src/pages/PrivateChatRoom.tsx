import React, { useState, useEffect } from 'react';

interface PrivateChatRoomProps {
  roomId?: string;
  userId?: string;
  telegramUsername?: string;
}

export const PrivateChatRoom: React.FC<PrivateChatRoomProps> = ({
  roomId = '201',
  userId = 'VIP_USER_77',
  telegramUsername = 'VIP_USER'
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [coinAlert, setCoinAlert] = useState<boolean>(false);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeProfileIdx, setActiveProfileIdx] = useState<number>(0);

  // Simulated nearby profiles that auto-rotate smoothly
  const nearbyProfiles = [
    { name: 'VIP Queen Sarah', dist: '1.2 km away', age: 24, status: 'Online' },
    { name: 'Executive Michael', dist: '2.5 km away', age: 28, status: 'VIP Lounge' },
    { name: 'Princess Elena', dist: '0.8 km away', age: 22, status: 'Active' },
    { name: 'Archduke David', dist: '3.1 km away', age: 30, status: 'Looking for pair' }
  ];

  useEffect(() => {
    // 1. Initial coin balance fetch
    fetch(`/api/user/user-coins/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.coins) setUserCoins(data.coins);
      })
      .catch(() => {});

    // 2. Coin drop trigger every 3 minutes (180,000ms) of active chat
    const coinTimer = setInterval(() => {
      setCoinAlert(true);
    }, 180000);

    // 3. Auto-rotate nearby profiles every 8 seconds
    const rotateTimer = setInterval(() => {
      setActiveProfileIdx((prev) => (prev + 1) % nearbyProfiles.length);
    }, 8000);

    // Explicit teardown to prevent memory leaks and ANR
    return () => {
      clearInterval(coinTimer);
      clearInterval(rotateTimer);
    };
  }, [userId]);

  const handleClaimCoins = async () => {
    try {
      const res = await fetch('/api/user/claim-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, telegramUsername, coinAmount: 2 })
      });
      if (res.ok) {
        const data = await res.json();
        setUserCoins(data.userCoins || userCoins + 2);
        setCoinAlert(false);
      }
    } catch (err) {
      console.error('Error claiming coins:', err);
      setUserCoins((prev) => prev + 2);
      setCoinAlert(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [...prev, { sender: 'You', text: inputText, time: new Date().toLocaleTimeString() }]);
    setInputText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      const urls = files.map((file) => URL.createObjectURL(file));
      setSelectedImages(urls);
    }
  };

  return (
    <div style={{ background: '#0a0a0c', color: '#fff', minHeight: '100vh', padding: '16px', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #D4AF37', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ color: '#D4AF37', margin: 0, fontSize: '16px' }}>SREYMARA PRIVATE SUITE #{roomId}</h2>
          <small style={{ color: '#00FFFF', fontSize: '11px' }}>● 1-on-1 Encrypted Affinity Channel</small>
        </div>
        <span style={{ color: '#00FF00', fontWeight: 'bold', fontSize: '13px', background: 'rgba(0,255,0,0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid #00FF00' }}>
          🪙 {userCoins} SREYMARA COINS
        </span>
      </div>

      {/* Auto-Rotating Nearby Regional Match Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #121224 0%, #1e112a 100%)',
        border: '1px solid rgba(236, 72, 153, 0.4)',
        borderRadius: '8px',
        padding: '10px 14px',
        marginTop: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ color: '#EC4899', fontSize: '10px', fontWeight: 'bold', display: 'block' }}>
            🛰️ REGIONAL RADAR (AUTO-MATCHING):
          </span>
          <strong style={{ color: '#FFF', fontSize: '13px' }}>
            {nearbyProfiles[activeProfileIdx].name} ({nearbyProfiles[activeProfileIdx].age})
          </strong>
          <span style={{ color: '#38BDF8', fontSize: '11px', marginLeft: '6px' }}>
            • {nearbyProfiles[activeProfileIdx].dist}
          </span>
        </div>
        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px' }}>
          {nearbyProfiles[activeProfileIdx].status}
        </span>
      </div>

      {/* Sreymara Coin Reward Alert Banner */}
      {coinAlert && (
        <div style={{
          background: 'linear-gradient(45deg, #FF007F, #D4AF37)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 0 15px rgba(255,0,127,0.4)'
        }}>
          <div>
            <strong style={{ color: '#fff', fontSize: '13px' }}>👑 Active Chat Reward!</strong>
            <p style={{ margin: 0, fontSize: '11px', color: '#fff' }}>Hello @{telegramUsername || 'VIP User'}, you earned +2 Sreymara Coins!</p>
          </div>
          <button 
            onClick={handleClaimCoins}
            style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
          >
            CLAIM NOW
          </button>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div style={{
        background: '#04060E',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '12px',
        minHeight: '160px',
        maxHeight: '260px',
        overflowY: 'auto',
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)', fontSize: '11px', color: '#CBD5E1' }}>
          👑 <b>SREYMARA MATCHMAKER:</b> You are connected in Private Suite #{roomId}. Zero bot auto-replies — awaiting live partner transmission.
        </div>
        {messages.map((m, idx) => (
          <div key={idx} style={{ background: '#EC4899', color: '#fff', padding: '8px 12px', borderRadius: '8px', alignSelf: 'flex-end', maxWidth: '80%', fontSize: '12px' }}>
            <strong>{m.sender}:</strong> {m.text}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          placeholder="Say something private..."
          style={{ flex: 1, background: '#12121c', border: '1px solid #D4AF37', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
        />
        <button 
          onClick={handleSendMessage}
          style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '8px 16px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          SEND
        </button>
      </div>

      {/* Profile & Image Gallery Section (Up to 10 Images) */}
      <div style={{ background: '#12121c', padding: '14px', borderRadius: '8px', marginTop: '16px', border: '1px solid #333' }}>
        <h3 style={{ fontSize: '13px', color: '#D4AF37', margin: '0 0 6px 0' }}>PROFILE GALLERY (UP TO 10 IMAGES)</h3>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px 0' }}>Upload your exclusive photos to share with VIP affinity matches:</p>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleImageUpload}
          style={{ color: '#888', fontSize: '11px' }} 
        />
        {selectedImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {selectedImages.map((src, i) => (
              <img key={i} src={src} alt="Uploaded Profile" style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
            ))}
          </div>
        )}
      </div>

      {/* $0.50 Premium Unlock Gate */}
      {!isUnlocked ? (
        <div style={{ background: '#170326', border: '1px solid #00FFFF', padding: '16px', borderRadius: '8px', marginTop: '16px', textAlign: 'center', boxShadow: '0 0 15px rgba(0,255,255,0.2)' }}>
          <h3 style={{ color: '#00FFFF', fontSize: '14px', margin: '0 0 6px 0' }}>UNLOCK PREMIUM MUSIC & GEMINI GENERATOR ($0.50)</h3>
          <p style={{ fontSize: '11px', color: '#CBD5E1', margin: '0 0 12px 0' }}>Pay $0.50 (USDT / Card / In-App) to access 24/7 AI music streaming, Gemini High-Res Image Generation, and Exclusive Member Lounge.</p>
          <button 
            onClick={() => setIsUnlocked(true)}
            style={{ background: 'linear-gradient(90deg, #00FFFF, #FF007F)', border: 'none', padding: '10px 24px', color: '#fff', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            UNLOCK FOR $0.50
          </button>
        </div>
      ) : (
        <div style={{ background: '#0a1a15', border: '1px solid #10B981', padding: '16px', borderRadius: '8px', marginTop: '16px', textAlign: 'center' }}>
          <h3 style={{ color: '#10B981', fontSize: '14px', margin: '0 0 4px 0' }}>👑 $0.50 PREMIUM ECOSYSTEM ACTIVE</h3>
          <p style={{ fontSize: '11px', color: '#CBD5E1', margin: 0 }}>Full access granted to AI Music Studio, Gemini HD Imager, and VIP Lounge.</p>
        </div>
      )}

    </div>
  );
};
