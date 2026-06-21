import React from 'react';
import { useAuth } from '../../contexts/SafeAuthProvider';
import Navbar from '../../components/Navbar';
import TikTok6ConversionChart from '../../components/admin/TikTok6ConversionChart';

/**
 * Digital Home Dashboard Grid Layer - Admin Panel
 * Ultra-premium executive digital estate interface
 * Note: Authorization is handled by MasterAdminRoute wrapper in App.tsx
 */
export default function DigitalHome() {
  const { isLoading } = useAuth();

  // Show loading spinner while session is being restored from Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        {/* Premium System Lens Indicator */}
        <div className="mb-8 text-center">
          <p className="text-xs font-mono tracking-widest text-emerald-400/80 uppercase">
            📱 System Lens Optimized: Captured with Maximum Digital Fidelity Matrix Parameters
          </p>
        </div>

        {/* Dashboard Grid - Executive Digital Estate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

          {/* Door 1: System Overview */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">System Overview</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time platform metrics, user engagement analytics, and system health monitoring across all operational nodes.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Online</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Live</span>
            </div>
          </div>

          {/* Door 2: Security Dashboard */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <span className="text-xl">🔐</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Security Dashboard</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dual-admin monitoring active. Surveillance matrix streaming across all access points and authentication layers.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Dual-Auth</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Secured</span>
            </div>
          </div>

          {/* Door 3: Financial Analytics */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Financial Analytics</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              $5 USDT Alpha + $5 USDT Beta pipeline streams. NC COINS treasury aggregation and yield calculations.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Dual Pipeline</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">30s Cycle</span>
            </div>
          </div>

          {/* Door 4: TikTok6 Node — with Conversion Tracker Chart */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-pink-500/30 transition-all duration-300 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">TikTok6 Node</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Multi-million contract router verified. Viral engine distribution across 50+ international regional nodes.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20">Active</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Global</span>
            </div>

            {/* Animated Product Conversion Tracker Chart */}
            <TikTok6ConversionChart />
          </div>

          {/* Door 5: Match Engine */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-rose-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <span className="text-xl">❤️</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Match Engine</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dating platform sandbox operational. Cross-regional matchmaking with real-time chat and discovery systems.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Live</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Social</span>
            </div>
          </div>

          {/* Door 6: Telegram Analytics */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <span className="text-xl">✈️</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Telegram Analytics</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bot webhook intelligence, command routing, crypto price feeds, and dual-admin surveillance matrix streaming.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Connected</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Bot Active</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-8 max-w-7xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs text-slate-400">All Systems Operational</span>
              </div>
              <div className="h-4 w-px bg-slate-700"></div>
              <span className="text-xs text-slate-500">6STARS Global Executive System</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Dual-Admin Monitoring:</span>
              <span className="text-xs text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}