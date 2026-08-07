import React, { useState, useEffect } from 'react';

const ExoClickAds: React.FC = () => {
  const [showPreRoll, setShowPreRoll] = useState(true);
  const [preRollComplete, setPreRollComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreRollComplete(true);
      setShowPreRoll(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  if (!showPreRoll || preRollComplete) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-sm mb-4">Advertisement</p>
        <div className="w-full max-w-2xl aspect-video bg-gray-800 flex items-center justify-center">
          <p className="text-gray-400">ExoClick Pre-roll Ad</p>
        </div>
        <p className="text-gray-500 text-xs mt-2">Skip in 15s...</p>
      </div>
    </div>
  );
};

const StickyFooterBanner: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-700 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="w-full max-w-2xl h-[50px] bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
          ExoClick Banner Ad (728x90)
        </div>
      </div>
    </div>
  );
};

const NativeContentWidget: React.FC = () => {
  return (
    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
      <h4 className="text-sm font-semibold text-white mb-3">Sponsored</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="p-3 bg-white/5 rounded-md text-center">
            <div className="w-full aspect-video bg-gray-700 mb-2 flex items-center justify-center text-gray-500 text-xs">
              Ad {item}
            </div>
            <p className="text-xs text-gray-400">Sponsored Content</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PropellerAdsScript: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.propellerads.com/scripts/popunder.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

const PPVModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition"
      >
        Unlock Premium Stream
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Premium Stream Access</h3>
            <p className="text-gray-400 text-sm mb-4">Unlock exclusive live streams with Web3 wallet or card payment.</p>
            <div className="space-y-3">
              <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition">
                Pay with Solana / USDT
              </button>
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                Pay with Stripe
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const AffiliateBanner: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/20">
      <h4 className="text-sm font-semibold text-white mb-2">Recommended</h4>
      <div className="flex flex-wrap gap-2">
        {['ExpressVPN', 'NordVPN', 'Roku', 'Fire TV', 'Trust Wallet'].map((brand) => (
          <span key={brand} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">
            {brand}
          </span>
        ))}
      </div>
    </div>
  );
};

export { ExoClickAds, StickyFooterBanner, NativeContentWidget, PropellerAdsScript, PPVModal, AffiliateBanner };
