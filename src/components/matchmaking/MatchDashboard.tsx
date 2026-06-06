import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';

const MatchDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chats' | 'discovery' | 'revenue'>('chats');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Matchmaking Admin Console</h1>
            <p className="text-gray-400">Premium triple-theme administrative interface</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-600/10 hover:scale-105 transition-all duration-300"
          >
            💼 Switch to Task Office
            <ChevronRight size={14} className="ml-2" />
          </Button>
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
            {/* TikTok-Style Diamond Stream Console */}
            <Card
              className="backdrop-blur-xl border-2 border-pink-500/30"
              style={{
                background: 'rgba(236, 72, 153, 0.1)',
                boxShadow: '0 0 30px rgba(236, 72, 153, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-pink-400 text-2xl">💎 TikTok-Style Diamond Stream Console</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4 hover:bg-pink-900/30 transition-all duration-300">
                      <p className="text-pink-300 text-sm mb-1">Virtual Gifts Exchanged</p>
                      <p className="text-3xl font-bold text-pink-400">12,847</p>
                      <div className="mt-2 h-2 bg-pink-900 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 animate-pulse" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4 hover:bg-pink-900/30 transition-all duration-300">
                      <p className="text-pink-300 text-sm mb-1">Luxury Crown Cash-Outs</p>
                      <p className="text-3xl font-bold text-pink-400">$89,432</p>
                      <div className="mt-2 h-2 bg-pink-900 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 animate-pulse" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4 hover:bg-pink-900/30 transition-all duration-300">
                      <p className="text-pink-300 text-sm mb-1">Platform 30% Curation Fee</p>
                      <p className="text-3xl font-bold text-pink-400">$26,829</p>
                      <div className="mt-2 h-2 bg-pink-900 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 animate-pulse" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Litmatch-Style Blind Box Match Matrix */}
            <Card
              className="backdrop-blur-xl border-2 border-cyan-500/30"
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-cyan-400 text-2xl">🎁 Litmatch-Style Blind Box Match Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 hover:bg-cyan-900/30 transition-all duration-300">
                      <p className="text-cyan-300 text-sm mb-1">Active Audio Matches (7-min)</p>
                      <p className="text-3xl font-bold text-cyan-400">3,421</p>
                      <div className="mt-2 h-2 bg-cyan-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 hover:bg-cyan-900/30 transition-all duration-300">
                      <p className="text-cyan-300 text-sm mb-1">Soul Cards Swapped Today</p>
                      <p className="text-3xl font-bold text-cyan-400">8,932</p>
                      <div className="mt-2 h-2 bg-cyan-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 hover:bg-cyan-900/30 transition-all duration-300">
                      <p className="text-cyan-300 text-sm mb-1">Speed Match Card Sales</p>
                      <p className="text-3xl font-bold text-cyan-400">1,247 NellyCoins</p>
                      <div className="mt-2 h-2 bg-cyan-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversational Fee Interceptor Deep Analytics Desk */}
            <Card
              className="backdrop-blur-xl border-2 border-emerald-500/30"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-emerald-400 text-2xl">💬 Conversational Fee Interceptor Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 hover:bg-emerald-900/30 transition-all duration-300">
                      <p className="text-emerald-300 text-sm mb-1">Singles Tax</p>
                      <p className="text-2xl font-bold text-emerald-400">$4,821</p>
                      <p className="text-emerald-500 text-xs mt-1">2,341 messages</p>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 hover:bg-emerald-900/30 transition-all duration-300">
                      <p className="text-emerald-300 text-sm mb-1">Couples Tax</p>
                      <p className="text-2xl font-bold text-emerald-400">$3,247</p>
                      <p className="text-emerald-500 text-xs mt-1">1,892 messages</p>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 hover:bg-emerald-900/30 transition-all duration-300">
                      <p className="text-emerald-300 text-sm mb-1">Travelers Tax</p>
                      <p className="text-2xl font-bold text-emerald-400">$2,891</p>
                      <p className="text-emerald-500 text-xs mt-1">1,423 messages</p>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 hover:bg-emerald-900/30 transition-all duration-300">
                      <p className="text-emerald-300 text-sm mb-1">Communities Tax</p>
                      <p className="text-2xl font-bold text-emerald-400">$1,847</p>
                      <p className="text-emerald-500 text-xs mt-1">892 messages</p>
                    </div>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-4">
                    <p className="text-emerald-400 font-semibold mb-3">Regional Distribution (Cambodia/Nigeria)</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Cambodia Singles</p>
                        <p className="text-emerald-400 text-sm">$2,847</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Nigeria Singles</p>
                        <p className="text-emerald-400 text-sm">$1,974</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Cambodia Couples</p>
                        <p className="text-emerald-400 text-sm">$1,892</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300">Nigeria Couples</p>
                        <p className="text-emerald-400 text-sm">$1,355</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anti-Scam Guard Bot High-Fidelity Alert Desk */}
            <Card
              className="backdrop-blur-xl border-2 border-yellow-500/30"
              style={{
                background: 'rgba(234, 179, 8, 0.05)',
                boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle className="text-yellow-400 text-2xl">🛡️ Anti-Scam Guard Bot Alert Desk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-400 font-semibold mb-3">Recently Flagged Profiles</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-red-900/20 border border-red-500/30 rounded p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <p className="text-gray-300 text-sm">user_8921@suspicious.com</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-xs">FROZEN</span>
                          <span className="text-yellow-400 text-xs">High Risk</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <p className="text-gray-300 text-sm">user_7342@flagged.com</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 text-xs">MONITORED</span>
                          <span className="text-orange-400 text-xs">Medium Risk</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-orange-900/20 border border-orange-500/30 rounded p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <p className="text-gray-300 text-sm">user_6129@review.com</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400 text-xs">REVIEW</span>
                          <span className="text-yellow-400 text-xs">Low Risk</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-900/30 transition-all duration-300">
                      <p className="text-yellow-300 text-sm mb-1">Protection Rate</p>
                      <p className="text-3xl font-bold text-yellow-400">99.8%</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-900/30 transition-all duration-300">
                      <p className="text-yellow-300 text-sm mb-1">Scammers Blocked Today</p>
                      <p className="text-3xl font-bold text-yellow-400">47</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-900/30 transition-all duration-300">
                      <p className="text-yellow-300 text-sm mb-1">Suspicious Accounts</p>
                      <p className="text-3xl font-bold text-yellow-400">156</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Original VIP Revenue Console */}
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
