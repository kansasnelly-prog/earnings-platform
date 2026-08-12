import { createClient } from '@supabase/supabase-js';

export type TelemetryCategory = 'optimization' | 'tiktok6' | 'cinema' | 'system' | 'executive';
export type TelemetryEventName = string;

export interface TelemetryPayload {
  [key: string]: any;
}

export interface TelemetryEvent {
  event_name: TelemetryEventName;
  event_category: TelemetryCategory;
  payload: TelemetryPayload;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient && supabaseUrl && supabaseServiceKey) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

export async function emitTelemetry(event: TelemetryEvent): Promise<{ success: boolean; correlationId?: string; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await client
      .from('telemetry_events')
      .insert({
        event_name: event.event_name,
        event_category: event.event_category,
        payload: event.payload,
        user_id: event.user_id || null,
        session_id: event.session_id || null,
        ip_address: event.ip_address || null,
        user_agent: event.user_agent || null,
        correlation_id: event.correlation_id || undefined,
      })
      .select('correlation_id')
      .single();

    if (error) {
      console.error('[Telemetry] Failed to emit event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, correlationId: data?.correlation_id };
  } catch (error: any) {
    console.error('[Telemetry] Exception emitting event:', error);
    return { success: false, error: error.message };
  }
}

export async function emitOptimizationEvent(eventName: string, payload: TelemetryPayload, user_id?: string) {
  return emitTelemetry({
    event_name: eventName,
    event_category: 'optimization',
    payload,
    user_id,
  });
}

export async function emitTikTok6Event(eventName: string, payload: TelemetryPayload, user_id?: string) {
  return emitTelemetry({
    event_name: eventName,
    event_category: 'tiktok6',
    payload,
    user_id,
  });
}

export async function emitCinemaEvent(eventName: string, payload: TelemetryPayload, user_id?: string) {
  return emitTelemetry({
    event_name: eventName,
    event_category: 'cinema',
    payload,
    user_id,
  });
}

export async function emitSystemEvent(eventName: string, payload: TelemetryPayload) {
  return emitTelemetry({
    event_name: eventName,
    event_category: 'system',
    payload,
  });
}

export async function emitExecutiveEvent(eventName: string, payload: TelemetryPayload) {
  return emitTelemetry({
    event_name: eventName,
    event_category: 'executive',
    payload,
  });
}
