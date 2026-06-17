import React, { useState, useEffect } from 'react';
import { Send, Zap, Lock, Database, Globe } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminCommandDeck: React.FC = () => {
  const [mintingActive, setMintingActive] = useState(false);
  const [csStatus, setCsStatus] = useState('Online');

  const handleToggleMinting = () => {
    setMintingActive(!mintingActive);
    toast({
      title: mintingActive ? 'Minting Stopped' : 'Minting Engine Activated',
      description: mintingActive ? 'Diamond minting loop paused.' : 'Diamond minting engine running at 10,000 HP.',
    });
  };

  return (
    <div className="space-y-6 p-6 bg-[#0a0e1a] border border-indigo-500/20 rounded-2xl">
      {/* Telegram Monetization & CS Command Deck */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Send className="text-indigo-400" size={20} />
          TELEGRAM MONETIZATION & CS COMMAND DECK
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <p className="text-sm text-gray-300">Live CS Status: <span className="text-emerald-400 font-bold">{csStatus}</span></p>
                <button className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors">
                    Broadcast Update
                </button>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                 <p className="text-sm text-gray-300">Monetization Active: <span className="text-emerald-400 font-bold">Enabled</span></p>
                 <button className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors">
                    Flush Pending Tokens
                </button>
            </div>
        </div>
      </div>

      {/* 10,000 HP Multi-User Diamond Minting Engine */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="text-amber-400" size={20} />
          10,000 HP MULTI-USER DIAMOND MINTING ENGINE
        </h2>
        <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-sm text-gray-300">Status: <span className={mintingActive ? 'text-emerald-400' : 'text-red-400'}>{mintingActive ? 'ACTIVE' : 'INACTIVE'}</span></p>
          <button 
            onClick={handleToggleMinting}
            className={`px-4 py-2 rounded text-sm font-bold ${mintingActive ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
          >
            {mintingActive ? 'Stop Minting' : 'Activate Minting'}
          </button>
        </div>
      </div>

      {/* Global Revenue Accruals & Territories */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="text-emerald-400" size={20} />
          GLOBAL REVENUE ACCRUALS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {['Nigeria 🇳🇬', 'Cambodia 🇰🇭', 'Ghana 🇬🇭', 'Philippines 🇵🇭', 'Vietnam 🇻🇳', 'Thailand 🇹🇭', 'Laos 🇱🇦', 'Pakistan 🇵🇰', 'USA 🇺🇸', 'Germany 🇩🇪', 'UK 🇬🇧', 'Spain 🇪🇸'].map(territory => (
            <div key={territory} className="p-2 bg-white/5 rounded border border-white/10 text-center">
                {territory}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCommandDeck;
