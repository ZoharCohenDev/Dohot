import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSession, onAuthStateChange } from '@/services/auth';
import { supabase, tables } from '@/lib/supabase';
import { saveBusinessProfile } from '@/services/profile';
import type { BusinessProfile, UpdateBusinessProfile } from '@dohot/shared';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  businessProfile: BusinessProfile | null;
  hasBusinessProfile: boolean;
  loading: boolean;
  refreshBusinessProfile: () => Promise<void>;
  updateProfile: (updates: UpdateBusinessProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  businessProfile: null,
  hasBusinessProfile: false,
  loading: true,
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
        // Shouldn't normally throw, but guard against it so loading never hangs
        setSession(null);
        setBusinessProfile(null);
        setLoading(false);
      });

    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Also fires when the refresh token is invalid/expired (Supabase handles
        // the purge internally and emits SIGNED_OUT rather than a separate event).
        setSession(null);
        setBusinessProfile(null);
        setLoading(false);
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        return;
      }
      // SIGNED_IN, INITIAL_SESSION, USER_UPDATED, etc.
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

  const refreshBusinessProfile = async () => {
    await loadBusinessProfile(session);
  };

  const updateProfile = async (updates: UpdateBusinessProfile): Promise<void> => {
    if (!session?.user) throw new Error('לא מחובר');
    const updated = await saveBusinessProfile(session.user.id, updates);
    setBusinessProfile(updated);
  };

  const hasBusinessProfile = Boolean(businessProfile?.business_name?.trim());

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        businessProfile,
        hasBusinessProfile,
        loading,
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
