import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import TelegramExecutiveAlertService from '@/services/telegramExecutiveAlertService';

interface YieldState {
  activeStreamId: string | null;
  watchSeconds: number;
  watchRewardPending: boolean;
  isMatchActive: boolean;
  elapsedSeconds: number;
  connectionId: string | null;
}

interface YieldActions {
  startWatching: (streamId: string) => void;
  stopWatching: () => void;
  claimWatchReward: () => Promise<void>;
  setMatchActive: (active: boolean) => void;
  resetConnectionTimer: () => void;
}

interface YieldStreamContextValue extends YieldState, YieldActions {}

const YieldStreamContext = createContext<YieldStreamContextValue | null>(null);

export const useYieldStream = (): YieldStreamContextValue => {
  const context = useContext(YieldStreamContext);
  if (!context) {
    throw new Error('useYieldStream must be used within YieldStreamProvider');
  }
  return context;
};

interface YieldStreamProviderProps {
  children: ReactNode;
}

export const YieldStreamProvider: React.FC<YieldStreamProviderProps> = ({ children }) => {
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [watchRewardPending, setWatchRewardPending] = useState(false);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (isMatchActive) {
      connectionTimerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (connectionTimerRef.current) {
      clearInterval(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }

    return () => {
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
      }
    };
  }, [isMatchActive]);

  const startWatching = (streamId: string) => {
    setActiveStreamId(streamId);
    setWatchSeconds(0);
    setWatchRewardPending(false);
  };

  const stopWatching = () => {
    setActiveStreamId(null);
    setWatchSeconds(0);
    setWatchRewardPending(false);
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
      console.error('[YieldStream] Watch reward claim failed:', error);
    } finally {
      setWatchRewardPending(false);
    }
  };

  const setMatchActive = (active: boolean) => {
    setIsMatchActive(active);
    if (!active) {
      setElapsedSeconds(0);
    }
  };

  const resetConnectionTimer = () => {
    setElapsedSeconds(0);
    setConnectionId(null);
    setIsMatchActive(false);
  };

  return (
    <YieldStreamContext.Provider
      value={{
        activeStreamId,
        watchSeconds,
        watchRewardPending,
        isMatchActive,
        elapsedSeconds,
        connectionId,
        startWatching,
        stopWatching,
        claimWatchReward,
        setMatchActive,
        resetConnectionTimer,
      }}
    >
      {children}
    </YieldStreamContext.Provider>
  );
};
