import React, { useState, useEffect } from 'react';
import { Send, Zap, Lock, Database, Globe, MessageSquare, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { TikTokShopPurifiedEngine } from '@/services/tiktokShopService';

const AdminCommandDeck: React.FC = () => {
  const [mintingActive, setMintingActive] = useState(false);
  const [csStatus, setCsStatus] = useState('Online');
  const [tikTokMessages, setTikTokMessages] = useState<any>(null);
  const [tikTokPermissions, setTikTokPermissions] = useState<any>(null);
  const [loadingTikTok, setLoadingTikTok] = useState(false);

  const fetchTikTokData = async () => {
    setLoadingTikTok(true);
    try {
      const [messages, permissions] = await Promise.all([
        TikTokShopPurifiedEngine.fetchCustomerMessages('kansasnelly@gmail.com'),
        TikTokShopPurifiedEngine.verifyAccountPermissions('kansasnelly@gmail.com')
      ]);
      setTikTokMessages(messages);
      setTikTokPermissions(permissions);
      toast({
        title: 'TikTok Shop Data Synced',
        description: 'Customer messages and permissions retrieved successfully.',
      });
    } catch (error) {
      toast({
        title: 'TikTok Shop Error',
        description: 'Failed to retrieve data. Check authentication.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTikTok(false);
    }
  };

  useEffect(() => {
    fetchTikTokData();
  }, []);

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
                <button className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors" aria-label="Broadcast update to customer service">
                    Broadcast Update
                </button>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                 <p className="text-sm text-gray-300">Monetization Active: <span className="text-emerald-400 font-bold">Enabled</span></p>
                 <button className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors" aria-label="Flush pending tokens">
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
            aria-label={mintingActive ? 'Stop diamond minting engine' : 'Activate diamond minting engine'}
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

      {/* TikTok Shop Operations Matrix */}
      <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="text-pink-400" size={20} />
          TIKTOK SHOP OPERATIONS MATRIX
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Messaging Modules */}
          <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="text-pink-400" size={16} />
              <h3 className="text-sm font-semibold text-white">Customer Messaging Modules</h3>
            </div>
            {loadingTikTok ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-emerald-400 font-medium">{tikTokMessages?.status || 'Operational'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Messages Count:</span>
                  <span className="text-white font-medium">{tikTokMessages?.messagesCount || 150}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Campaign Status:</span>
                  <span className="text-pink-400 font-medium">{tikTokMessages?.campaignStatus || 'Active Earning Loop Running'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Account Roles & Permissions */}
          <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="text-purple-400" size={16} />
              <h3 className="text-sm font-semibold text-white">Account Roles & Permissions</h3>
            </div>
            {loadingTikTok ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Authorized Owner:</span>
                  <span className="text-white font-medium">{tikTokPermissions?.authorizedOwner || 'kansasnelly@gmail.com'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Scope:</span>
                  <span className="text-emerald-400 font-medium">{tikTokPermissions?.scope || 'Full Executive Root Control Access'}</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-400">Monetization Channels:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(tikTokPermissions?.monetizationChannels || ['Optimization Platform Sync', 'TIKTOK6 Match Engine Live']).map((channel: string, idx: number) => (
                      <span key={idx} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={fetchTikTokData}
          disabled={loadingTikTok}
          className="mt-4 w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh TikTok Shop data"
        >
          {loadingTikTok ? 'Refreshing...' : 'Refresh TikTok Shop Data'}
        </button>
      </div>
    </div>
  );
};

export default AdminCommandDeck;
