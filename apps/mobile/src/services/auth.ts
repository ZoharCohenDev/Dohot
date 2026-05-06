import { supabase } from '@/lib/supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface SessionResult {
  session: Session | null;
  user: User | null;
}

// ─── Phone OTP (primary auth flow for Israeli field professionals) ─────────────

/**
 * Step 1 — send a 6-digit OTP via SMS to the given Israeli phone number.
 * Phone must be in E.164 format: +972501234567
 */
export async function sendPhoneOTP(phone: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Step 2 — verify the OTP received by the user.
 * On success, Supabase sets and persists the session automatically.
 */
export async function verifyPhoneOTP(phone: string, token: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Email/password (fallback or admin use) ───────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  meta: { full_name: string; phone?: string },
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta },
  });
  if (error) return { success: false, error: error.message };
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

export function getCurrentUser(): User | null {
  return supabase.auth.getUser().then(({ data }) => data.user) as unknown as User | null;
}
