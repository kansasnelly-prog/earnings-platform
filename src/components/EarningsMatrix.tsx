import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CircleDollarSign, Clock3, Eye, MousePointerClick, RefreshCw } from 'lucide-react';
import { supabaseMain } from '@/lib/supabaseClient';
import { useAppContext } from '@/contexts/AppContext';

type EarningRow = { reward_amount: number | null; reward_currency: string | null; status: string | null; created_at: string };

const EarningsMatrix: React.FC = () => {
  const { user } = useAppContext();
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabaseMain.from('user_earnings').select('reward_amount,reward_currency,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (!error) setRows((data || []) as EarningRow[]);
    else console.warn('[EarningsMatrix] Live ledger unavailable:', error.message);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user?.id) return;
    const channel = supabaseMain.channel(`earnings-matrix-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_earnings', filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { void supabaseMain.removeChannel(channel); };
  }, [user?.id]);

  const metrics = useMemo(() => {
    const usd = rows.filter((row) => ['usdt', 'usdc', 'usd'].includes((row.reward_currency || '').toLowerCase())).reduce((sum, row) => sum + Number(row.reward_amount || 0), 0);
    const pending = rows.filter((row) => row.status === 'pending').reduce((sum, row) => sum + Number(row.reward_amount || 0), 0);
    const today = rows.filter((row) => Date.now() - new Date(row.created_at).getTime() < 86400000).reduce((sum, row) => sum + Number(row.reward_amount || 0), 0);
    return { usd, pending, today };
  }, [rows]);

  const cards = [
    ['Verified ledger', `$${metrics.usd.toFixed(2)}`, CircleDollarSign],
    ['Pending review', `$${metrics.pending.toFixed(2)}`, Clock3],
    ['Last 24 hours', `$${metrics.today.toFixed(2)}`, Activity],
    ['Tracked events', rows.length.toString(), BarChart3],
  ] as const;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b1020]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Earnings intelligence</p><h2 className="mt-1 text-xl font-bold text-white">Real-time earning matrix</h2><p className="mt-1 text-sm text-slate-400">Only ledger events reported by configured providers are shown as verified.</p></div>
        <button onClick={load} aria-label="Refresh earnings" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><Icon size={16} className="text-cyan-300" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>)}</div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Event</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Time</th></tr></thead><tbody>{rows.slice(0, 6).map((row, index) => <tr key={`${row.created_at}-${index}`} className="border-t border-white/5 text-slate-300"><td className="px-3 py-2">{row.reward_currency || 'Ledger'}</td><td className="px-3 py-2">{Number(row.reward_amount || 0).toFixed(4)}</td><td className="px-3 py-2">{row.status || 'reported'}</td><td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
    </section>
  );
};

export default EarningsMatrix;
