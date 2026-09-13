import { createClient } from '@supabase/supabase-js';

// Read Supabase environment variables from Vite .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// --- „Maradjak bejelentkezve" ---------------------------------------------
// A pipa korábban csak dísz volt: a kliens fixen localStorage-ba mentett,
// tehát a kikapcsolása semmit nem változtatott. Itt egy saját storage-adapter
// dönti el futásidőben, hogy a munkamenet tartósan (localStorage) vagy csak a
// fül bezárásáig (sessionStorage) éljen.

const REMEMBER_KEY = 'homehub_remember_device';

const shouldRemember = (): boolean => {
  try {
    // alapértelmezés: emlékezzen (ez a pipa alapállapota is)
    return localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
};

/** Bejelentkezés ELŐTT kell hívni, hogy a munkamenet a jó helyre kerüljön. */
export const setRememberDevice = (remember: boolean) => {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  } catch {
    /* privát mód / letiltott tárolás — marad az alapértelmezés */
  }
};

const authStorage = {
  getItem: (key: string) => {
    try {
      const store = shouldRemember() ? localStorage : sessionStorage;
      return store.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      const store = shouldRemember() ? localStorage : sessionStorage;
      store.setItem(key, value);
    } catch {
      /* nincs mit tenni, a munkamenet memóriában marad */
    }
  },
  removeItem: (key: string) => {
    // mindkét helyről takarítunk, hogy ne maradjon árva munkamenet
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  }
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage
      }
    })
  : null;
