import React, { useState, useEffect } from 'react';

/**
 * ExecutiveOperationsSwitchboard – visual panel representing executive command functions.
 * This component is decorative only and uses the exec-panel styling for a premium look.
 * It simulates a luxury aerospace command deck with toggle switches, buttons, and indicators.
 */
const ExecutiveOperationsSwitchboard: React.FC = () => {
  return (
    <section className="exec-panel cyber-card p-4 bg-black-glass rounded-lg ambient-glow animate-cyberGlow">
      <h2 className="text-3xl font-extrabold text-white mb-2">Executive Operations Switchboard</h2>
      <p className="text-base text-gray-300 mb-4">
        Visual controls, toggles, and status relays for the command center.
      </p>

      {/* Master Control Panel */}
      <div className="space-y-4 cyber-card p-4 bg-glassmorphism rounded-xl border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-2">Master Control</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Toggle Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>System Power</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Signal Boost</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Data Flow</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Security Lock</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">CPU Load</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-1/2 bg-green-500 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">Memory</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-3/5 bg-yellow-500 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">Network</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-4/5 bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">Storage</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-1/3 bg-red-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Controls */}
      <div className="space-y-4 cyber-card p-4 bg-glassmorphism rounded-xl border border-white/10 shadow-lg">
        <h3 className="font-semibold text-white mb-2">Secondary Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Buttons */}
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              Initiate Scan
            </button>
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              Deploy Protocol
            </button>
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              System Diagnostics
            </button>
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              Emergency Override
            </button>
          </div>

          {/* Dial Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Frequency</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-45 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Amplitude</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-135 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Phase</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-225 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Gain</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-315 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Node Display */}
      <div className="space-y-4 cyber-card p-4 bg-glassmorphism rounded-xl border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-2">Command Node Display</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Node Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Node Alpha</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
          </div>

          {/* Node Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Latency</span>
              <span className="monospace">12ms</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Throughput</span>
              <span className="monospace">1.2 Gbps</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Error Rate</span>
              <span className="monospace">0.01%</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Uptime</span>
              <span className="monospace">99.9%</span>
            </div>
          </div>
        </div>
      </div>
      {/* Global Executive Master Deck */}
      <GlobalExecutiveMasterDeck />
      {/* Bybit Multi-Payment Gate */}
      <BybitMultiPaymentGate />
    </section>
  );
};

// ====================
// GlobalExecutiveMasterDeck Component
// ====================
const GlobalExecutiveMasterDeck: React.FC = () => {
  const [currentWorld, setCurrentWorld] = useState<'optimization' | 'tiktok6'>('tiktok6');
  const [globalTreasury, setGlobalTreasury] = useState(1450930822.45);
  const [isMintingActive, setIsMintingActive] = useState(false);
  const [mintedDiamonds, setMintedDiamonds] = useState(1420930);

  const engines = [
    { id: '01', name: 'Real-Time Bidder', status: 'online', telemetry: 'TPS: 1200', latency: '12ms' },
    { id: '02', name: 'Ad Delivery Engine', status: 'online', telemetry: 'Impressions: 3.2M', latency: '15ms' },
    { id: '03', name: 'Data Sync Processor', status: 'maintenance', telemetry: 'Sync Lag: 5s', latency: 'N/A' },
    { id: '04', name: 'User Matching Engine', status: 'online', telemetry: 'Matches/sec: 450', latency: '9ms' },
    { id: '05', name: 'Revenue Optimizer', status: 'offline', telemetry: 'Revenue: $0', latency: 'N/A' },
    { id: '06', name: 'Ad Payload Injector', status: 'online', telemetry: 'Payloads: 800', latency: '11ms' },
  ];

  const adMatrices = [
    { name: 'AETHERIS-PRIME-QUANTUM', rate: 12.5, accumulated: 42093040.5 },
    { name: 'VALERIAN-FORTRESS-MATRIX', rate: 15.2, accumulated: 98402100.2 },
    { name: 'CHRONOS-PULSE-ARTILLERY', rate: 18.0, accumulated: 12054000.8 },
  ];

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', earnings: 4209300.5 },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', earnings: 1840210.2 },
    { code: 'KH', name: 'Cambodia', flag: '🇰🇭', earnings: 1205400.8 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      let drop = Math.random() * 5;
      if (isMintingActive) {
        setMintedDiamonds(prev => prev + Math.floor(Math.random() * 12 + 4));
        drop += 25.5;
      }
      setGlobalTreasury(prev => prev + drop);
    }, 1000);
    return () => clearInterval(timer);
  }, [isMintingActive]);

  return (
    <section className="p-4 bg-gray-900 text-white rounded-lg mb-4">
      <h3 className="text-xl font-bold mb-2">Global Executive Master Deck</h3>
      <div className="flex items-center space-x-4 mb-2">
        <button
          className={`px-2 py-1 ${currentWorld === 'tiktok6' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => setCurrentWorld('tiktok6')}
        >
          TikTok6
        </button>
        <button
          className={`px-2 py-1 ${currentWorld === 'optimization' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => setCurrentWorld('optimization')}
        >
          Optimization
        </button>
      </div>
      <p className="mb-2">Current World: {currentWorld}</p>
      <p className="mb-2">Total Treasury: ${globalTreasury.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      {currentWorld === 'tiktok6' && (
        <div>
          <h4 className="font-semibold">Engines</h4>
          <ul className="list-disc list-inside">
            {engines.map(e => (
              <li key={e.id}>
                {e.name} – {e.status} – {e.telemetry} – {e.latency}
              </li>
            ))}
          </ul>
          <h4 className="font-semibold mt-2">Ad Matrices</h4>
          <ul className="list-disc list-inside">
            {adMatrices.map((m, i) => (
              <li key={i}>
                {m.name}: +{m.rate}x/s – ${m.accumulated.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

// ====================
// BybitMultiPaymentGate Component
// ====================
const BybitMultiPaymentGate: React.FC = () => {
  const MASTER_BYBIT_WALLET = "THw79g2JzNj2GYtLnCXR6kRQpYRSvR2mo6";

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [transactionHash, setTransactionHash] = useState('');
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_BYBIT_WALLET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const startPayment = () => {
    setPaymentStatus('verifying');
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setPaymentStatus(success ? 'success' : 'failed');
      if (success) {
        setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));
      }
    }, 1500);
  };

  return (
    <section className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-xl font-bold mb-2">Bybit Multi-Payment Gate</h3>
      <p className="mb-2">Master Wallet (TRON): {MASTER_BYBIT_WALLET}</p>
      <button
        className="px-3 py-1 bg-blue-600 rounded mr-2"
        onClick={copyAddress}
      >
        {copied ? 'Copied!' : 'Copy Address'}
      </button>
      <button
        className="px-3 py-1 bg-green-600 rounded"
        onClick={startPayment}
        disabled={paymentStatus === 'verifying'}
      >
        {paymentStatus === 'verifying' ? 'Verifying...' : 'Start Payment'}
      </button>
      {paymentStatus === 'success' && (
        <p className="mt-2 text-green-400">Payment successful! Tx: {transactionHash}</p>
      )}
      {paymentStatus === 'failed' && (
        <p className="mt-2 text-red-400">Payment failed. Try again.</p>
      )}
    </section>
  );
};

export default ExecutiveOperationsSwitchboard;
