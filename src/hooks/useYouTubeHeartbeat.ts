import { useEffect, useRef, useCallback } from 'react';

const HEARTBEAT_INTERVAL_MS = 10_000;

export function useYouTubeHeartbeat(playerRef: any, enabled: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async (videoTimestamp?: number) => {
    try {
      const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
      if (!token) return;

      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoTimestamp: videoTimestamp ?? 0,
          sessionToken: token,
        }),
      });
    } catch (error) {
      console.error('[Heartbeat] Failed:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getPlayerState) return;

      const isPlaying = player.getPlayerState() === 1;
      const isVisible = document.visibilityState === 'visible';

      if (isPlaying && isVisible) {
        const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        sendHeartbeat(currentTime);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, playerRef, sendHeartbeat]);
}
