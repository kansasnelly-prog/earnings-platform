import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const MatchDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chats' | 'discovery' | 'revenue'>('chats');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Matchmaking Admin Console</h1>
          <p className="text-gray-400">Premium triple-theme administrative interface</p>
        </div>

        {/* Tab Toggles */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'chats'
                ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            ❤️‍🔥 Direct Chats Desk
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'discovery'
                ? 'bg-gradient-to-r from-purple-600 to-violet-800 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🔮 Social Discovery Feed
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'revenue'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            👑 VIP Revenue Console
          </button>
        </div>

        {/* Direct Chats Desk Tab - Deep Ruby Crimson Glassmorphism */}
        {activeTab === 'chats' && (
          <div className="space-y-6">
            <Card
              className="backdrop-blur-xl border-2 border-red-500/30"
              style={{
                background: 'rgba(153, 27, 27, 0.1)',
                boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-red-400 text-2xl">Direct Chats Desk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-900/30 transition-all duration-300">
                      <p className="text-red-300 text-sm mb-1">Active Conversations</p>
                      <p className="text-3xl font-bold text-red-400">1,247</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-900/30 transition-all duration-300">
                      <p className="text-red-300 text-sm mb-1">Messages Today</p>
                      <p className="text-3xl font-bold text-red-400">8,532</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-900/30 transition-all duration-300">
                      <p className="text-red-300 text-sm mb-1">Response Rate</p>
                      <p className="text-3xl font-bold text-red-400">94.2%</p>
                    </div>
                  </div>
                  <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 font-semibold mb-3">Messaging Queue Telemetry</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-gray-300 text-sm">Queue A: 234 pending messages</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-gray-300 text-sm">Queue B: 189 pending messages</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-gray-300 text-sm">Queue C: 412 pending messages</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Social Discovery Feed Tab - Midnight Dark Neon Violet */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            <Card
              className="backdrop-blur-xl border-2 border-purple-500/30"
              style={{
                background: 'rgba(88, 28, 135, 0.1)',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-purple-400 text-2xl">Social Discovery Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/30 transition-all duration-300">
                      <p className="text-purple-300 text-sm mb-1">Singles</p>
                      <p className="text-3xl font-bold text-purple-400">3,891</p>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/30 transition-all duration-300">
                      <p className="text-purple-300 text-sm mb-1">Couples</p>
                      <p className="text-3xl font-bold text-purple-400">1,247</p>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/30 transition-all duration-300">
                      <p className="text-purple-300 text-sm mb-1">Travelers</p>
                      <p className="text-3xl font-bold text-purple-400">892</p>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/30 transition-all duration-300">
                      <p className="text-purple-300 text-sm mb-1">Communities</p>
                      <p className="text-3xl font-bold text-purple-400">456</p>
                    </div>
                  </div>
                  <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-purple-400 font-semibold mb-3">Profile Distribution by Region</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Cambodia</p>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-purple-900 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: '65%' }}></div>
                          </div>
                          <p className="text-purple-400 text-sm">65%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Nigeria</p>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-purple-900 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: '25%' }}></div>
                          </div>
                          <p className="text-purple-400 text-sm">25%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Other Regions</p>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-purple-900 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: '10%' }}></div>
                          </div>
                          <p className="text-purple-400 text-sm">10%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIP Revenue Console Tab - Gleaming Frosted Gold Acrylic */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <Card
              className="backdrop-blur-xl border-2 border-yellow-500/30"
              style={{
                background: 'rgba(234, 179, 8, 0.05)',
                boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-yellow-400 text-2xl">VIP Revenue Console</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-900/30 transition-all duration-300">
                      <p className="text-yellow-300 text-sm mb-1">NellyCoins Collected</p>
                      <p className="text-3xl font-bold text-yellow-400">2,847,391</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-900/30 transition-all duration-300">
                      <p className="text-yellow-300 text-sm mb-1">Curation Fee Split</p>
                      <p className="text-3xl font-bold text-yellow-400">$142,369</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-900/30 transition-all duration-300">
                      <p className="text-yellow-300 text-sm mb-1">Active VIPs</p>
                      <p className="text-3xl font-bold text-yellow-400">892</p>
                    </div>
                  </div>
                  <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-400 font-semibold mb-3">Anti-Scam Guard Bot Status</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Bot Active</p>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-green-400 text-sm">Online</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Scammers Blocked Today</p>
                        <p className="text-red-400 text-sm font-semibold">47</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Suspicious Accounts Flagged</p>
                        <p className="text-yellow-400 text-sm font-semibold">156</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Protection Rate</p>
                        <p className="text-green-400 text-sm font-semibold">99.8%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDashboard;
