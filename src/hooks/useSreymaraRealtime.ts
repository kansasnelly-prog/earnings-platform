import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

type RealtimeChannel = 'matchmaking' | 'chat' | 'streams' | 'yield';

interface RealtimeState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useSreymaraRealtime<T>(
  channelName: RealtimeChannel,
  tableName: string,
  filter?: { column: string; value: string }
) {
  const [state, setState] = useState<RealtimeState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const channelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        let query = supabase.from(tableName).select('*');

        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (isMounted) {
          setState((prev) => ({ ...prev, data: data || [], loading: false }));
        }
      } catch (error: any) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            error: error.message || 'Failed to fetch data',
            loading: false,
          }));
        }
      }
    };

    fetchInitial();

    const channel = supabase
      .channel(`${channelName}-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        },
        (payload) => {
          if (!isMounted) return;

          setState((prev) => {
            const newData = [...prev.data];

            if (payload.eventType === 'INSERT') {
              newData.unshift(payload.new as T);
            } else if (payload.eventType === 'UPDATE') {
              const index = newData.findIndex(
                (item: any) => item.id === (payload.new as any).id
              );
              if (index >= 0) {
                newData[index] = payload.new as T;
              }
            } else if (payload.eventType === 'DELETE') {
              const index = newData.findIndex(
                (item: any) => item.id === (payload.old as any).id
              );
              if (index >= 0) {
                newData.splice(index, 1);
              }
            }

            return { ...prev, data: newData };
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, tableName, JSON.stringify(filter)]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      let query = supabase.from(tableName).select('*');
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      const { data, error } = await query;
      if (error) throw error;
      setState((prev) => ({ ...prev, data: data || [], loading: false, error: null }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  }, [tableName, JSON.stringify(filter)]);

  return { ...state, refresh };
}

export function useMatchmakingEngine(userId?: string) {
  return useSreymaraRealtime<any>(
    'matchmaking',
    'matchmaking_sessions',
    userId ? { column: 'user_id', value: userId } : undefined
  );
}

export function useActiveChat(conversationId?: string) {
  return useSreymaraRealtime<any>(
    'chat',
    'messages',
    conversationId ? { column: 'conversation_id', value: conversationId } : undefined
  );
}

export function useLiveStreams() {
  return useSreymaraRealtime<any>('streams', 'live_streams');
}

export function useSolanaYieldEvents(walletAddress?: string) {
  return useSreymaraRealtime<any>(
    'yield',
    'solana_yield_events',
    walletAddress ? { column: 'wallet_address', value: walletAddress } : undefined
  );
}
