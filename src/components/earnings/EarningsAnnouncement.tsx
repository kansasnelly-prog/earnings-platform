import React, { useState } from 'react';
import { Zap } from 'lucide-react';

const EarningsAnnouncement: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  const scrollToAds = () => {
    const adsSection = document.getElementById('adsgram-rewarded-video-section');
    if (adsSection) {
      adsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-slate-900/95 via-blue-900/60 to-slate-900/95 p-6 shadow-[0_0_25px_rgba(59,130,246,0.25)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400" size={20} />
          <h2 className="text-xl font-bold text-white">
            ⚡ Quadruple Your Earnings Today!
          </h2>
        </div>

        <p className="text-sm text-slate-200">
          We have <span className="font-semibold text-white">4 active high-paying earning methods</span> integrated into the app:
        </p>

        <ul className="grid grid-cols-1 gap-2 text-sm text-slate-300 md:grid-cols-2">
          <li>• Rewarded Video Ads <span className="text-emerald-300">(Instant payout per full view)</span></li>
          <li>• Telegram Stars Rewards</li>
          <li>• TON &amp; Solana Staking</li>
          <li>• Daily Tasks &amp; Offchain Rewards</li>
        </ul>

        <p className="text-sm text-slate-300">
          Combined, your balance grows <span className="font-semibold text-white">4x faster</span>. Get your group watching ads and completing tasks today to hit the payout threshold faster and cash out!
        </p>

        <button
          onClick={scrollToAds}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Watch Ads &amp; Claim USDT
        </button>
      </div>
    </div>
  );
};

export default EarningsAnnouncement;
