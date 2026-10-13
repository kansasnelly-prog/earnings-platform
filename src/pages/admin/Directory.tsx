import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowDownToLine, Settings, Key, UsersRound, BarChart3, Megaphone, Radio, Film, Shield, Bot, Globe, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const AdminDirectory: React.FC = () => {
  const navigate = useNavigate();

  const panels = [
    { id: 'command-center', label: 'Command Center', desc: 'Main admin hub — overview, users, withdrawals, controls, match, TikTok, vault, cinema & monetization.', icon: LayoutDashboard, route: '/admin/command-center' },
    { id: 'ai-workspace', label: 'AI Workspace', desc: 'Premium 3D admin panels, NellyCoin ledger, and platform controls.', icon: Bot, route: '/admin/ai-workspace' },
    { id: 'digital-home', label: 'Digital Home Grid', desc: 'Executive digital-estate dashboard with system overview and live status.', icon: Globe, route: '/admin/digital-home' },
    { id: 'enhanced', label: 'Enhanced Dashboard', desc: 'Full operations dashboard — users, tasks, catalog, support, training & system health.', icon: BarChart3, route: '/admin/enhanced' },
    { id: 'dashboard', label: 'Classic Dashboard', desc: 'Core metrics, stats cards, user directory and withdrawal approvals.', icon: Activity, route: '/admin/dashboard' },
    { id: 'real', label: 'Real-Time Dashboard', desc: 'Live platform stats and treasury minting telemetry.', icon: Zap, route: '/admin/real' },
    { id: 'simple', label: 'Simple Panel', desc: 'Lightweight quick-access admin panel.', icon: Shield, route: '/admin/simple' },
    { id: 'match', label: 'Match & Chat Monitor', desc: 'Dating matchmaking oversight, discovery feeds and chat sandbox admin.', icon: UsersRound, route: '/admin/match' },
    { id: 'tiktok6-match', label: 'TikTok6 Match Admin', desc: 'TikTok6 matchmaking & monetization machine control panel.', icon: Film, route: '/admin/tiktok6-match' },
    { id: 'users', label: 'User Directory', desc: 'Registered users, VIP tiers, account status, and role management.', icon: Users, route: '/admin/command-center' },
    { id: 'payouts', label: 'Withdrawals & Payouts', desc: 'Pending orders, withdrawal approvals, and transaction logging.', icon: ArrowDownToLine, route: '/admin/command-center' },
    { id: 'controls', label: 'Admin Controls', desc: 'System controls, task migrations, treasury alerts, and live debugging.', icon: Settings, route: '/admin/command-center' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} aria-label="Back to home">
              <Shield size={18} />
            </Button>
            <div>
              <h1 className="font-bold text-white">Admin Directory</h1>
              <p className="text-xs text-slate-400">Unified executive hub launcher</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate('/'))} aria-label="Logout">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((panel) => (
            <Card
              key={panel.id}
              className="bg-slate-900/90 border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer"
              onClick={() => navigate(panel.route)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <panel.icon size={20} className="text-indigo-400" />
                  </div>
                  <CardTitle className="text-slate-100">{panel.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 leading-relaxed">{panel.desc}</p>
                <Button variant="ghost" size="sm" className="mt-4 text-indigo-400 hover:text-indigo-300">
                  Open Panel <Shield size={14} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDirectory;
