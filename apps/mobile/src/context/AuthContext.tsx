import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { getSession, onAuthStateChange } from '@/services/auth';
import { supabase, tables } from '@/lib/supabase';
import { saveBusinessProfile } from '@/services/profile';
import type { BusinessProfile, UpdateBusinessProfile, UserRole } from '@dohot/shared';

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  businessProfile: BusinessProfile | null;
  hasBusinessProfile: boolean;
  loading: boolean;
  // role / subscription
  role: UserRole | null;
  isAdmin: boolean;
  isActive: boolean;
  daysUntilExpiration: number | null;
  isSubscriptionExpired: boolean;
  isSubscriptionWarning: boolean; // within 7 days of expiry
  refreshBusinessProfile: () => Promise<void>;
  updateProfile: (updates: UpdateBusinessProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  businessProfile: null,
  hasBusinessProfile: false,
  loading: true,
  role: null,
  isAdmin: false,
  isActive: true,
  daysUntilExpiration: null,
  isSubscriptionExpired: false,
  isSubscriptionWarning: false,
  refreshBusinessProfile: async () => undefined,
  updateProfile: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBusinessProfile = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setBusinessProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from(tables.businessProfiles)
      .select('*')
      .eq('id', currentSession.user.id)
      .maybeSingle();

    if (error) {
      setBusinessProfile(null);
      return;
    }

    setBusinessProfile((data as BusinessProfile | null) ?? null);
  };

  useEffect(() => {
    getSession()
      .then(async ({ session }) => {
        setSession(session);
        await loadBusinessProfile(session);
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setBusinessProfile(null);
        setLoading(false);
      });

    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setBusinessProfile(null);
        setLoading(false);
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        // Reload profile so admin changes (deactivation, subscription expiry)
        // take effect without requiring a full re-login.
        if (session) loadBusinessProfile(session).catch(() => {});
        return;
      }
      setSession(session);
      if (session) {
        setLoading(true);
        loadBusinessProfile(session)
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    });

    return unsubscribe;
  }, []);

  // ── Live user-status watcher ──────────────────────────────────────────────
  // Keeps a ref so the Realtime/AppState callbacks always call the latest
  // version of loadBusinessProfile without being stale closures.
  const loadProfileRef = useRef(loadBusinessProfile);
  useEffect(() => { loadProfileRef.current = loadBusinessProfile; });

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const reload = () => {
      supabase.auth.getSession()
        .then(({ data }) => { if (data.session) loadProfileRef.current(data.session); })
        .catch(() => {});
    };

    // Primary: Supabase Realtime — instant when the table has Realtime enabled
    // in the Supabase dashboard (Database → Replication).
    const channel = supabase
      .channel(`profile-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tables.businessProfiles,
          filter: `id=eq.${userId}`,
        },
        reload,
      )
      .subscribe();

    // Fallback 1: re-fetch whenever the app returns from background.
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') reload();
    });

    // Fallback 2: poll every 30 s while the app is open.
    // Guarantees detection even if Realtime is not configured and the user
    // never backgrounds the app.
    const pollInterval = setInterval(reload, 30_000);

    return () => {
      supabase.removeChannel(channel);
      appStateSub.remove();
      clearInterval(pollInterval);
    };
  }, [session?.user?.id]); // re-subscribe only when the logged-in user changes

  const refreshBusinessProfile = async () => {
    await loadBusinessProfile(session);
  };

  const updateProfile = async (updates: UpdateBusinessProfile): Promise<void> => {
    if (!session?.user) throw new Error('לא מחובר');
    const updated = await saveBusinessProfile(session.user.id, updates);
    setBusinessProfile(updated);
  };

  const hasBusinessProfile = Boolean(businessProfile?.business_name?.trim());
  const role: UserRole | null = (businessProfile?.role as UserRole) ?? null;
  const isAdmin = role === 'admin';
  // Fail-closed: if the profile couldn't be loaded, treat the account as
  // inactive rather than letting an unverified user into the app.
  const isActive = businessProfile?.is_active ?? false;
  const days = daysUntil(businessProfile?.subscription_expiration_date ?? null);
  const isSubscriptionExpired = days !== null && days < 0;
  const isSubscriptionWarning = days !== null && days >= 0 && days <= 7;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        businessProfile,
        hasBusinessProfile,
        loading,
        role,
        isAdmin,
        isActive,
        daysUntilExpiration: days,
        isSubscriptionExpired,
        isSubscriptionWarning,
        refreshBusinessProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
