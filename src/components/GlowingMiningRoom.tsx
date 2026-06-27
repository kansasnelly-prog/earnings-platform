import React, { useState, useEffect } from 'react';
import './MiningEffects.css';

export const GlowingMiningRoom: React.FC = () => {
  const [multiplier, setMultiplier] = useState(1);
  const [isGlittering, setIsGlittering] = useState(false);
  const [active, setActive] = useState(false);

  const engines = [
    "Monero (XMR) Native Agent",
    "Krytex Windows Subsystem",
    "NiceHash Stratum Link",
    "StormGain Faucet Automator",
    "Solana SaintBot CLI",
    "Hummingbot Liquidity Pooler",
    "Pionex Grid Core",
    "3Commas DCA Execution",
    "Cryptohopper Risk Shield",
    "ASIC Network Rig Master",
  ];

  const handleActionTrigger = () => {
    setIsGlittering(true);
    setMultiplier((prev) => (prev >= 10 ? 1 : prev + 1));
  };

  useEffect(() => {
    if (isGlittering) {
      const timer = setTimeout(() => setIsGlittering(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isGlittering]);

  return (
    <div style={{ background: '#07020d', padding: '30px', borderRadius: '12px', border: '1px solid #33145a' }}>
      <h2 style={{ color: '#fff' }}>$NCAI MULTI-ENGINE PREMIUM MINTING GATEWAY</h2>
      {/* Dynamic Visual Counter */}
      <div style={{ margin: '20px 0', textAlign: 'center' }}>
        <span className={`multiplier-badge ${isGlittering ? 'glitter-active' : ''}`}>
          {multiplier}x MULTIPLIER ACTIVE
        </span>
      </div>
      <button
        onClick={() => { setActive(!active); handleActionTrigger(); }}
        style={{ padding: '15px 30px', background: '#d500f9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {active ? "⚡ ENGINES DISPATCHING POWER" : "▶ INITIALIZE MINING LAYER"}
      </button>
      {active && (
        <div className="engine-grid-premium">
          {engines.map((name, i) => (
            <div
              key={i}
              onClick={handleActionTrigger}
              style={{ padding: '15px', background: '#120720', borderLeft: '4px solid #00e5ff', borderRadius: '4px', cursor: 'pointer' }}
            >
              <strong style={{ color: '#00e5ff', display: 'block' }}>{name}</strong>
              <small style={{ color: '#aaa' }}>Click asset node to step up output yield.</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlowingMiningRoom;