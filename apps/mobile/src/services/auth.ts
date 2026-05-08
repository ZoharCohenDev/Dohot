import { supabase } from '@/lib/supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
  emailConfirmationRequired?: boolean;
}

export interface SessionResult {
  session: Session | null;
  user: User | null;
}

// ─── Username/password ────────────────────────────────────────────────────────

/**
 * Sign in with username + password.
 * Internally maps username → username@dohot.app (Supabase email auth).
 * Admin creates users via the server API using this same email convention.
 */
export async function signInWithUsername(username: string, password: string): Promise<AuthResult> {
  const email = `${username.toLowerCase().trim()}@dohot.app`;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Surface a friendlier message for wrong credentials
    const msg = error.message.includes('Invalid login credentials')
      ? 'שם משתמש או סיסמה שגויים'
      : error.message;
    return { success: false, error: msg };
  }
  return { success: true };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Session ─────────────────────────────────────────────────────────────────

export async function getSession(): Promise<SessionResult> {
  const { data } = await supabase.auth.getSession();
  return {
    session: data.session,
    user: data.session?.user ?? null,
  };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * @example
 * useEffect(() => onAuthStateChange((event, session) => { ... }), []);
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

// ─── Current user helper ─────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
