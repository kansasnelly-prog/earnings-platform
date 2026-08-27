import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, LogIn, Settings, UserPlus,
  AlertTriangle, DollarSign, Key,
  ChevronDown, ChevronRight, Megaphone, Radio, Film, Globe, Zap
} from 'lucide-react';
import AdminMatchDigitalHome from '../../pages/admin-match';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminControls from './AdminControls';
import ProductCatalogManager from './ProductCatalogManager';
import AdminUsers from './AdminUsers';
import AdminPasswordReset from './AdminPasswordReset';
import AdminCommandDeck from './AdminCommandDeck';
import GeminiCommandCenter from './GeminiStudioCommand';
import CinemaTelemetryPanel from './CinemaTelemetryPanel';
import MonetizationHub from '@/components/earnings/MonetizationHub';


interface RealUser {
  id: string;
  email: string;
  vip_level: number;
  balance: number;
  total_earned: number;
  created_at: string;
  account_status: 'active' | 'suspended' | 'flagged';
  is_frozen: boolean;
  tasks_completed: number;
  account_type: 'personal' | 'training';
  status?: string;
}

const MainAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals' | 'admin-controls' | 'password-reset' | 'match-admin' | 'tiktok' | 'telegram' | 'vault' | 'cinema' | 'monetization'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: ArrowDownToLine },
    { id: 'admin-controls' as const, label: 'Admin Controls', icon: Settings },
    { id: 'password-reset' as const, label: 'Password Reset', icon: Key },
    { id: 'match-admin' as const, label: 'Match Admin', icon: Users },
    { id: 'tiktok' as const, label: 'TikTok / Social', icon: Megaphone },
    { id: 'telegram' as const, label: 'Telegram Hub', icon: Radio },
    { id: 'vault' as const, label: 'Executive Vault', icon: BarChart3 },
    { id: 'cinema' as const, label: 'Cinema Telemetry', icon: Film },
    { id: 'monetization' as const, label: 'Monetization Hub', icon: Zap },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/'); return; }
      const { data: userData } = await supabase.from('users').select('account_type').eq('id', session.user.id).single();
      if (userData?.account_type !== 'admin') { navigate('/'); return; }
      setIsAuthenticated(true);
      setIsInitialized(true);
    };
    checkAuth();
  }, [navigate]);

  if (!isInitialized) return <div className="text-center p-10">Verifying access...</div>;
  if (!isAuthenticated) return <div className="text-center p-10 text-white bg-[#060a14]">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} aria-label="Back to home"><ChevronLeft size={18} /></Button>
            <h1 className="font-bold text-white">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate('/'))} aria-label="Logout"><LogIn size={14} className="mr-2" />Logout</Button>
        </div>
      </header>

      <nav className="bg-[#0a0e1a]/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-2 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="gap-2"
              >
                <tab.icon size={16} />
                {tab.label}
              </Button>
            ))}
        </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/90 border-slate-700/50">
                <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-emerald-400"><Activity size={16} /> All Systems Operational</div>
                  <p className="text-sm text-slate-400 mt-2">Web, Telegram Mini App, and backend services are healthy.</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/90 border-slate-700/50">
                <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setActiveTab('tiktok')}>TikTok / Social Panel</Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setActiveTab('telegram')}>Telegram Hub Sync</Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setActiveTab('vault')}>Executive Vault & Monetization</Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setActiveTab('cinema')}>Cinema Telemetry</Button>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'users' && <AdminUsers onLogout={() => navigate('/')} />}
          {activeTab === 'withdrawals' && (
            <Card className="bg-slate-900/90 border-slate-700/50">
              <CardHeader><CardTitle>Withdrawals & Payouts</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">Pending orders and withdrawal management are available in the admin directory.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/admin')}>Open Full Directory</Button>
              </CardContent>
            </Card>
          )}
          {activeTab === 'admin-controls' && <AdminControls onRefresh={() => {}} />}
          {activeTab === 'password-reset' && <AdminPasswordReset />}
          {activeTab === 'match-admin' && <section className="mt-8"><AdminMatchDigitalHome /></section>}
          {activeTab === 'tiktok' && <AdminCommandDeck />}
          {activeTab === 'telegram' && (
            <Card className="bg-slate-900/90 border-slate-700/50">
              <CardHeader><CardTitle>Telegram App Hub Sync</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400"><Radio size={16} /> Bot Status: Online</div>
                <p className="text-sm text-slate-400">Mini App ecosystem overview, webhook health, and bot analytics are available in the admin directory.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>Open Full Directory</Button>
              </CardContent>
            </Card>
          )}
          {activeTab === 'vault' && <GeminiCommandCenter />}
          {activeTab === 'cinema' && <CinemaTelemetryPanel />}
          {activeTab === 'monetization' && <MonetizationHub />}
        </main>
    </div>
  );
};

export default MainAdminPanel;
