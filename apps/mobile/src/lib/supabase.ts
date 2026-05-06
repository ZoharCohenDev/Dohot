import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ─── SecureStore adapter ──────────────────────────────────────────────────────
// SecureStore on iOS has a 2 KB limit per key. Supabase session tokens
// often exceed this, so we chunk the value across multiple keys.

const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}__n`);
    if (!chunkCountStr) {
      return SecureStore.getItemAsync(key);
    }
    let value = '';
    const n = Number(chunkCountStr);
    for (let i = 0; i < n; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}__${i}`);
      if (chunk == null) return null;
      value += chunk;
    }
    return value;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const n = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__n`, String(n));
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(
        `${key}__${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}__n`);
    if (chunkCountStr) {
      const n = Number(chunkCountStr);
      for (let i = 0; i < n; i++) {
        await SecureStore.deleteItemAsync(`${key}__${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}__n`);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL']!;
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY']!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Typed table shortcuts ────────────────────────────────────────────────────
// Centralises table names so a rename only needs to happen here.

export const tables = {
  businessProfiles: 'business_profiles',
  customers: 'customers',
  documents: 'documents',
  reports: 'reports',
  quoteItems: 'quote_items',
} as const;
