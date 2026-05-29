import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom React hook that sets up a secure background activity heartbeat engine.
 * It tracks user session and runs a 60-second interval to update/increment 
 * active session duration (duration_minutes) and last_heartbeat timestamp in 
 * the 'user_activity_logs' Supabase table.
 */
export function useUserActivity() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // 1. Define the heartbeat function
    const sendHeartbeat = async (userId: string) => {
      try {
        console.log(`[Heartbeat Engine] Sending heartbeat for user: ${userId}`);

        // Fetch the most recent activity log entry for the user
        const { data, error: selectError } = await supabase
          .from('user_activity_logs')
          .select('id, duration_minutes')
          .eq('user_id', userId)
          .order('last_heartbeat', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (selectError) {
          console.error('[Heartbeat Engine] Error fetching user log:', selectError);
          return;
        }

        const now = new Date().toISOString();

        if (data) {
          // Record exists: update duration_minutes and last_heartbeat
          const nextDuration = (data.duration_minutes || 0) + 1;
          const { error: updateError } = await supabase
            .from('user_activity_logs')
            .update({
              duration_minutes: nextDuration,
              last_heartbeat: now
            })
            .eq('id', data.id);

          if (updateError) {
            console.error('[Heartbeat Engine] Error updating heartbeat:', updateError);
          } else {
            console.log(`[Heartbeat Engine] Heartbeat updated. Total duration: ${nextDuration} mins`);
          }
        } else {
          // No record exists: insert a new activity log entry
          const { error: insertError } = await supabase
            .from('user_activity_logs')
            .insert({
              user_id: userId,
              duration_minutes: 1,
              last_heartbeat: now
            });

          if (insertError) {
            console.error('[Heartbeat Engine] Error inserting initial heartbeat:', insertError);
          } else {
            console.log('[Heartbeat Engine] Initial heartbeat logged successfully.');
          }
        }
      } catch (err) {
        console.error('[Heartbeat Engine] Unexpected error in heartbeat tick:', err);
      }
    };

    // 2. Set up/reset interval helper
    const setupInterval = (userId: string) => {
      // Clear existing interval if any
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      console.log(`[Heartbeat Engine] Initializing 60s heartbeat timer for user: ${userId}`);
      
      // Trigger an immediate heartbeat check/setup
      sendHeartbeat(userId);

      // Start the 60-second interval
      intervalRef.current = setInterval(() => {
        sendHeartbeat(userId);
      }, 60000);
    };

    // 3. Monitor auth state changes to dynamically adapt the heartbeat
    const initializeAuthTracking = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userIdRef.current = session.user.id;
        setupInterval(session.user.id);
      }

      // Subscribe to real-time auth changes (sign in, sign out, token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const currentUserId = session?.user?.id || null;

        if (currentUserId !== userIdRef.current) {
          userIdRef.current = currentUserId;

          if (currentUserId) {
            setupInterval(currentUserId);
          } else {
            console.log('[Heartbeat Engine] User logged out. Clearing heartbeat timer.');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      });

      unsubscribe = () => {
        subscription.unsubscribe();
      };
    };

    initializeAuthTracking();

    // 4. Clean up subscriptions and intervals on component unmount
    return () => {
      console.log('[Heartbeat Engine] Cleaning up heartbeat resources.');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
}

export default useUserActivity;
