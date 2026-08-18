import React, { useState, useEffect, useRef } from 'react';
import GlitterBlock from '../GlitterBlock';
import { useLiveStreams } from '@/hooks/useSreymaraRealtime';

type StreamSubTab = 'following' | 'foryou' | 'latest';

const StreamTab: React.FC = () => {
  const [subTab, setSubTab] = useState<StreamSubTab>('foryou');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [watchRewardPending, setWatchRewardPending] = useState(false);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Wire to Supabase Realtime live streams
  const { data: streams, loading } = useLiveStreams();

  useEffect(() => {
    if (activeStreamId) {
      watchIntervalRef.current = setInterval(() => {
        setWatchSeconds((s) => s + 1);
      }, 1000);
    } else if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [activeStreamId]);

  const handleWatch = async (stream: any) => {
    setActiveStreamId(stream.id);
    setWatchSeconds(0);
    setWatchRewardPending(false);

    try {
      await fetch('/api/cinema/stream-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          videoId: stream.id,
          watchDurationSeconds: 0,
          rewardAmount: 0.01,
          sessionId: `stream-${stream.id}-${Date.now()}`,
          metadata: { title: stream.title, host: stream.host },
        }),
      });
    } catch (error) {
      console.error('[StreamTab] Stream watch start failed:', error);
    }
  };

  const claimWatchReward = async () => {
    if (!activeStreamId || watchRewardPending) return;
    setWatchRewardPending(true);

    try {
      const response = await fetch('/api/cinema/stream-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          videoId: activeStreamId,
          watchDurationSeconds: watchSeconds,
          rewardAmount: Math.max(0.01, watchSeconds * 0.001),
          sessionId: `stream-${activeStreamId}-${Date.now()}`,
        }),
      });

      if (response.ok) {
        TelegramExecutiveAlertService.sendYieldAlert(
          Math.max(0.01, watchSeconds * 0.001),
          `watch-${activeStreamId}-${Date.now()}`
        );
      }
    } catch (error) {
      console.error('[StreamTab] Watch reward claim failed:', error);
    } finally {
      setWatchRewardPending(false);
    }
  };
  const displayStreams = streams && streams.length > 0
    ? streams
    : [
        { id: '1', title: 'Executive Strategy Session', host: 'SREYMARA HQ', viewers: '1.2K', category: 'Business' },
        { id: '2', title: 'AI & Automation Workshop', host: 'Tech Lab', viewers: '890', category: 'Tech' },
        { id: '3', title: 'Live Matchmaking Event', host: 'Match Engine', viewers: '2.4K', category: 'Social' },
        { id: '4', title: 'Crypto Market Analysis', host: 'Solana Desk', viewers: '1.5K', category: 'Finance' },
      ];

  const formatWatchTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 py-1">
      <div className="flex bg-slate-900/70 border border-rose-500/15 p-1 gap-1">
        {(['following', 'foryou', 'latest'] as StreamSubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`
              flex-1 py-2.5 text-[10px] font-black tracking-[0.2em] uppercase transition-all
              ${subTab === tab
                ? 'bg-rose-500/18 text-rose-400 border border-rose-500/45 shadow-[0_0_12px_rgba(220,20,60,0.2)]'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }
            `}
          >
            {tab === 'foryou' ? 'For You' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayStreams.map((stream: any) => (
          <GlitterBlock key={stream.id} glowColor="crimson" padding="md">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-xs font-black text-slate-200 mb-1">{stream.title || 'Live Stream'}</div>
                <div className="text-[10px] text-slate-500">by {stream.host || 'SREYMARA'}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 border border-red-500/25">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] text-red-400 sreymara-mono">{stream.viewers || '0'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-600 tracking-[0.25em] uppercase font-black">{stream.category || 'LIVE'}</span>
              {activeStreamId === stream.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-400 sreymara-mono">{formatWatchTime(watchSeconds)}</span>
                  <button
                    onClick={claimWatchReward}
                    disabled={watchRewardPending}
                    className="px-4 py-2 bg-emerald-500/18 border border-emerald-500/45 text-emerald-400 text-[9px] font-black tracking-widest uppercase hover:bg-emerald-500/28 transition-all disabled:opacity-50"
                  >
                    {watchRewardPending ? 'CLAIMING...' : 'CLAIM REWARD'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleWatch(stream)}
                  className="px-4 py-2 bg-rose-500/18 border border-rose-500/45 text-rose-400 text-[9px] font-black tracking-widest uppercase hover:bg-rose-500/28 transition-all"
                >
                  Watch
                </button>
              )}
            </div>
          </GlitterBlock>
        ))}
      </div>
    </div>
  );
};

export default StreamTab;
