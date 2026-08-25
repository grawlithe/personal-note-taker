import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SyncConfig, DailyNote } from '../types';
import { getAllDailyNotes, saveAllDailyNotes } from './storage';

const CONFIG_KEY = 'zen_notes_supabase_config_v1';

export function getSyncConfig(): SyncConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const url = parsed.supabaseUrl || envUrl;
      const key = parsed.supabaseAnonKey || envKey;
      return {
        supabaseUrl: url,
        supabaseAnonKey: key,
        isLoggedIn: Boolean(url && key),
        autoSync: true,
        lastSyncedAt: parsed.lastSyncedAt
      };
    }
  } catch (err) {
    console.error('Error reading sync config:', err);
  }

  return {
    supabaseUrl: envUrl,
    supabaseAnonKey: envKey,
    isLoggedIn: Boolean(envUrl && envKey),
    autoSync: true
  };
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('zen_sync_config_updated', { detail: config }));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSyncConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export async function pushLocalToSupabase(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }

  try {
    const allNotes = getAllDailyNotes();
    const rows = Object.values(allNotes).map(note => ({
      id: note.id,
      date: note.date,
      formatted_date: note.formattedDate,
      title: note.title,
      note_category: note.noteCategory || null,
      lines: note.lines,
      updated_at: note.updatedAt || new Date().toISOString()
    }));

    const { error } = await client
      .from('daily_notes')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Supabase push error:', error);
      return { success: false, message: error.message };
    }

    const config = getSyncConfig();
    config.lastSyncedAt = new Date().toLocaleTimeString();
    saveSyncConfig(config);

    return { success: true, message: 'Successfully synced local notes to cloud!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sync failed' };
  }
}

export async function pullFromSupabase(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }

  try {
    const { data, error } = await client
      .from('daily_notes')
      .select('*');

    if (error) {
      return { success: false, message: error.message };
    }

    if (data && data.length > 0) {
      const allNotes = getAllDailyNotes();
      data.forEach((row: any) => {
        const note: DailyNote = {
          id: row.id,
          date: row.date,
          formattedDate: row.formatted_date || row.date,
          title: row.title,
          noteCategory: row.note_category || undefined,
          lines: row.lines || [],
          updatedAt: row.updated_at || new Date().toISOString()
        };
        allNotes[note.id] = note;
      });

      saveAllDailyNotes(allNotes);
      const config = getSyncConfig();
      config.lastSyncedAt = new Date().toLocaleTimeString();
      saveSyncConfig(config);
      return { success: true, message: `Fetched ${data.length} notes from cloud.` };
    }

    return { success: true, message: 'Cloud database is empty.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Pull failed' };
  }
}

export function subscribeToRealtimeSync(onUpdate: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('public:daily_notes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_notes' },
      () => {
        pullFromSupabase().then(() => {
          onUpdate();
        });
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
