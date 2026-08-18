import React, { useState } from 'react';
import GlitterBlock from '../GlitterBlock';
import { useMatchmakingEngine } from '@/hooks/useSreymaraRealtime';

type MatchEngine = 'soul' | 'voice' | 'party' | 'worldwide' | 'ai';

interface MatchEngineConfig {
  id: MatchEngine;
  name: string;
  description: string;
  icon: string;
  color: 'crimson' | 'teal' | 'gold' | 'cyan';
  status: 'active' | 'searching' | 'idle';
}

const LiveTab: React.FC = () => {
  const [engines, setEngines] = useState<MatchEngineConfig[]>([
    { id: 'soul', name: 'Soul Game', description: 'Blind audio matching', icon: '♫', color: 'crimson', status: 'idle' },
    { id: 'voice', name: 'Voice Game', description: 'Real-time voice rooms', icon: '☎', color: 'teal', status: 'idle' },
    { id: 'party', name: 'Party Match', description: 'Group social events', icon: '◉', color: 'gold', status: 'idle' },
    { id: 'worldwide', name: 'Worldwide Match', description: 'Global connections', icon: '🌐', color: 'cyan', status: 'idle' },
    { id: 'ai', name: 'AI Match Engine', description: 'Gemini-powered matching', icon: '◆', color: 'crimson', status: 'idle' },
  ]);

  // Wire to Supabase Realtime matchmaking sessions
  const { data: matchSessions, loading } = useMatchmakingEngine();

  const toggleEngine = async (id: MatchEngine) => {
    setEngines((prev) => {
      const engine = prev.find(e => e.id === id);
      if (!engine || engine.status !== 'idle') {
        return prev;
      }

      const updated = prev.map((eng) =>
        eng.id === id
          ? { ...eng, status: 'searching' as const }
          : eng
      );

      fetch('/api/matchmaking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineId: id, userId: 'current-user' }),
      }).catch((error) => {
        console.error('[LiveTab] Matchmaking start failed:', error);
      });

      return updated;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400';
      case 'searching':
        return 'text-yellow-400 animate-pulse';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-600 tracking-[0.3em] uppercase font-black">
          Matchmaking Engines
        </div>
        {matchSessions && matchSessions.length > 0 && (
          <div className="text-[9px] text-emerald-400 sreymara-mono animate-pulse">
            {matchSessions.length} ACTIVE
          </div>
        )}
      </div>

      {engines.map((engine) => (
        <GlitterBlock key={engine.id} glowColor={engine.color} padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{engine.icon}</div>
              <div>
                <div className="text-xs font-black text-slate-200">{engine.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{engine.description}</div>
              </div>
            </div>
            <button
              onClick={() => toggleEngine(engine.id)}
              className={`
                px-4 py-2 text-[9px] font-black tracking-widest uppercase border transition-all
                ${engine.status === 'searching'
                  ? 'bg-yellow-500/18 border-yellow-500/55 text-yellow-400 animate-pulse'
                  : engine.status === 'active'
                  ? 'bg-emerald-500/18 border-emerald-500/55 text-emerald-400'
                  : 'bg-slate-900/70 border-slate-700 text-slate-500 hover:border-rose-500/55 hover:text-rose-400'
                }
              `}
            >
              {engine.status === 'searching' ? 'SEARCHING...' : engine.status === 'active' ? 'LIVE' : 'START'}
            </button>
          </div>
          {engine.status === 'searching' && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-900 overflow-hidden border border-yellow-500/20">
                <div className="h-full bg-gradient-to-r from-rose-500 to-yellow-500 animate-pulse" style={{ width: '60%' }} />
              </div>
              <span className="text-[9px] text-yellow-400 sreymara-mono">Finding match...</span>
            </div>
          )}
        </GlitterBlock>
      ))}
    </div>
  );
};

export default LiveTab;
