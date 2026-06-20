import React from 'react';
import { useAuth } from '../../contexts/SafeAuthProvider';
import { MASTER_ADMIN_EMAIL, DUAL_ADMIN_EMAIL } from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

/**
 * Digital Home Dashboard Grid Layer - Admin Match Panel
 * Ultra-premium executive digital estate interface for matchmaking oversight
 */
export default function AdminMatchDigitalHome() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isAuthorized = user?.email === MASTER_ADMIN_EMAIL || user?.email === DUAL_ADMIN_EMAIL;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">Access denied. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        {/* Premium System Lens Indicator */}
        <div className="mb-8 text-center">
          <p className="text-xs font-mono tracking-widest text-rose-400/80 uppercase">
            📱 System Lens Optimized: Captured with Maximum Digital Fidelity Matrix Parameters
          </p>
        </div>

        {/* Dashboard Grid - Match Admin Digital Estate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

          {/* Door 1: Match Overview */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-rose-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <span className="text-xl">❤️</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Match Overview</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time matchmaking metrics, active user pairs, connection success rates, and regional distribution analytics.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Live</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">50+ Countries</span>
            </div>
          </div>

          {/* Door 2: User Monitoring */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-violet-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">User Monitoring</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dual-admin surveillance of user profiles, verification status, report handling, and community moderation tools.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">Dual-Auth</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Monitoring</span>
            </div>
          </div>

          {/* Door 3: Revenue Analytics */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-xl">💎</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Revenue Analytics</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Premium chat revenue, Speed Match (10 NC) transactions, gift economy flow, and NC COINS circulation metrics.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Tracking</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">NC Economy</span>
            </div>
          </div>

          {/* Door 4: Regional Hubs */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-xl">🌍</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Regional Hubs</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nigeria 🇳🇬 Cambodia 🇰🇭 Ghana 🇬🇭 Philippines 🇵🇭 Vietnam 🇻🇳 — Localized matchmaking pools and translation engine status.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">5 Hubs</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Multi-Lang</span>
            </div>
          </div>

          {/* Door 5: Pipeline Streams */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Pipeline Streams</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              $5 USDT Alpha + $5 USDT Beta dual pipeline yield tracking. 30-second interval minting loop and treasury aggregation.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Dual Stream</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">30s Cycle</span>
            </div>
          </div>

          {/* Door 6: Security & Moderation */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="text-xl">🛡️</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Security & Moderation</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Content moderation queue, user report handling, ban management, and dual-admin audit trail logging.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-red-500/10 text-red-400 border border-red-500/20">Protected</span>
              <span className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">Audit Log</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-8 max-w-7xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></div>
                <span className="text-xs text-slate-400">Match Engine Operational</span>
              </div>
              <div className="h-4 w-px bg-slate-700"></div>
              <span className="text-xs text-slate-500">6STARS Match Administration System</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Dual-Admin Monitoring:</span>
              <span className="text-xs text-rose-400">Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}