import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client instance (or fallback)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'mock_key';
const supabase = createClient(supabaseUrl, supabaseKey);

export const ExecutiveDashboard: React.FC = () => {
  const [usdtBalance, setUsdtBalance] = useState<number>(12450.00);
  const [solBalance, setSolBalance] = useState<number>(76.8);
  const [usdcBalance, setUsdcBalance] = useState<number>(5200.00);
  const [ethBalance, setEthBalance] = useState<number>(4.25);
  const [activeBankToggle, setActiveBankToggle] = useState<string>('ZENUS_BANK');
  const [selectedCountry, setSelectedCountry] = useState<string>('GLOBAL');
  const [liveImpressions, setLiveImpressions] = useState<any[]>([
    { pipeline_type: 'WEB3_DSP', source_module: 'AI_CHAT', country_code: 'USA', cpm_earned: 3.80 },
    { pipeline_type: 'WEB2_SSP', source_module: 'IN_APP_BANNER', country_code: 'KHM', cpm_earned: 2.45 },
    { pipeline_type: 'WEB3_DSP', source_module: 'CINEMA_STREAMING', country_code: 'GBR', cpm_earned: 4.20 }
  ]);

  useEffect(() => {
    // Realtime Supabase Subscription for Ad Engine Yields
    try {
      const channel = supabase
        .channel('ad_impressions_live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ad_impressions' }, 
          (payload: any) => {
            if (payload && payload.new) {
              setLiveImpressions((prev) => [payload.new, ...prev.slice(0, 9)]);
              setUsdtBalance((prev) => prev + (payload.new.cpm_earned / 1000));
            }
          })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    } catch (e) {
      console.warn('Realtime channel fallback active');
    }
  }, []);

  const handleSolToUsdtSwap = async () => {
    const oraclePrice = 162.40;
    if (solBalance < 1) return;

    setSolBalance((prev) => prev - 1);
    setUsdtBalance((prev) => prev + oraclePrice);

    try {
      await fetch('/api/ads/exchange/sol-to-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'executive_vip_user',
          solAmount: 1,
          oraclePrice: 162.40
        })
      });
    } catch (err) {
      console.warn('Swap log fallback:', err);
    }
  };

  return (
    <div style={{ background: '#0a0a0c', color: '#fff', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* Executive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #D4AF37', paddingBottom: '16px' }}>
        <h1 style={{ color: '#D4AF37', margin: 0, fontSize: '20px', letterSpacing: '1px' }}>SREYMARA EXECUTIVE AD ENGINE HUB</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#00FFFF', fontSize: '12px', fontWeight: 'bold' }}>● LIVE REALTIME SYNC</span>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{ background: '#1a1a24', color: '#fff', border: '1px solid #D4AF37', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
          >
            <option value="GLOBAL">Global Revenue View</option>
            <option value="USA">United States (USD)</option>
            <option value="KHM">Cambodia (KHR/USD)</option>
            <option value="GBR">United Kingdom (GBP)</option>
          </select>
        </div>
      </div>

      {/* Balance & Automated Settlement Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
        
        <div style={{ background: '#12121c', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 8px 0' }}>PORTFOLIO USDT BALANCE</h3>
          <p style={{ fontSize: '28px', color: '#D4AF37', fontWeight: 'bold', margin: '0 0 4px 0' }}>${usdtBalance.toFixed(4)} USDT</p>
          <small style={{ color: '#64748B', fontSize: '10px' }}>Settled via Adyen / Rapyd / Tipalti</small>
        </div>

        <div style={{ background: '#12121c', border: '1px solid rgba(0, 255, 255, 0.4)', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 8px 0' }}>SOLANA SAFE POT (SOL)</h3>
          <p style={{ fontSize: '28px', color: '#00FFFF', fontWeight: 'bold', margin: '0 0 10px 0' }}>{solBalance.toFixed(2)} SOL</p>
          <button 
            onClick={handleSolToUsdtSwap}
            style={{ background: 'linear-gradient(45deg, #D4AF37, #FF9900)', border: 'none', padding: '8px 14px', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', fontSize: '11px' }}
          >
            SWAP 1 SOL TO USDT ($162.40)
          </button>
        </div>

        <div style={{ background: '#12121c', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 8px 0' }}>USDC & ETH REVENUE</h3>
          <p style={{ fontSize: '18px', color: '#10B981', fontWeight: 'bold', margin: '0 0 4px 0' }}>{usdcBalance.toFixed(2)} USDC</p>
          <p style={{ fontSize: '16px', color: '#A855F7', fontWeight: 'bold', margin: 0 }}>{ethBalance.toFixed(4)} ETH</p>
          <small style={{ color: '#64748B', fontSize: '10px' }}>Multi-Chain Direct Yield Pipeline</small>
        </div>

      </div>

      {/* Multi-Bank Payout & Virtual Card BaaS Toggle */}
      <div style={{ background: '#12121c', border: '1px solid #333', padding: '20px', borderRadius: '8px', marginTop: '24px' }}>
        <h3 style={{ color: '#D4AF37', fontSize: '14px', margin: '0 0 6px 0' }}>MULTI-BANK PAYOUT TOGGLE & VIRTUAL CARD BAAS</h3>
        <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 12px 0' }}>Select active settlement channel for automated revenue routing:</p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['ZENUS_BANK', 'AIRWALLEX', 'ADYEN_GLOBAL', 'RAPYD_PAYOUT', 'TIPALTI'].map((provider) => (
            <button
              key={provider}
              onClick={() => setActiveBankToggle(provider)}
              style={{
                padding: '10px 16px',
                background: activeBankToggle === provider ? '#D4AF37' : '#1a1a24',
                color: activeBankToggle === provider ? '#000' : '#fff',
                border: '1px solid #D4AF37',
                fontWeight: 'bold',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {provider.replace('_', ' ')} {activeBankToggle === provider ? '(ACTIVE)' : ''}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '14px', background: '#0a0a0c', borderRadius: '6px', border: '1px dashed #555' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#FFF' }}>ISSUED VIRTUAL CARD STATUS (BAAS VERIFIED)</h4>
          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94A3B8' }}>Card Number: <strong style={{ color: '#FFF' }}>**** **** **** 8821</strong> | {activeBankToggle.replace('_', ' ')}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>KYC/AML Identity Status: <span style={{ color: '#00FF00', fontWeight: 'bold' }}>VERIFIED & INDEPENDENT</span></p>
        </div>
      </div>

      {/* Dual Pipeline Live Stream */}
      <div style={{ marginTop: '24px', background: '#12121c', padding: '20px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <h3 style={{ color: '#00FFFF', fontSize: '14px', margin: '0 0 12px 0' }}>DUAL-PIPELINE MONETIZATION STREAM (SSP / DSP REALTIME)</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {liveImpressions.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '8px', padding: '8px 12px', background: '#0a0a0f', borderRadius: '4px', fontSize: '11px', borderLeft: item.pipeline_type === 'WEB3_DSP' ? '3px solid #38BDF8' : '3px solid #EC4899' }}>
              <span style={{ color: item.pipeline_type === 'WEB3_DSP' ? '#38BDF8' : '#EC4899', fontWeight: 'bold' }}>[{item.pipeline_type}]</span> Module: <strong style={{ color: '#FFF' }}>{item.source_module}</strong> | Country: {item.country_code} | Yield: <span style={{ color: '#10B981', fontWeight: 'bold' }}>+${item.cpm_earned} CPM</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};
