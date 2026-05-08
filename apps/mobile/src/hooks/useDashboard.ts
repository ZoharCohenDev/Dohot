import { useState, useEffect } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { DocumentWithCustomer } from './useDocuments';

interface DashboardStats {
  monthlyReports: number;
  activeQuotes: number;
}

export function useDashboard() {
  const { businessProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ monthlyReports: 0, activeQuotes: 0 });
  const [recent, setRecent] = useState<DocumentWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessProfile) return;

    const load = async () => {
      setLoading(true);
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [recentRes, monthlyRes, quotesRes] = await Promise.all([
          supabase
            .from(tables.documents)
            .select('*, customers(name)')
            .eq('professional_id', businessProfile.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from(tables.documents)
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', businessProfile.id)
            .eq('type', 'report')
            .gte('created_at', startOfMonth.toISOString()),
          supabase
            .from(tables.documents)
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', businessProfile.id)
            .eq('type', 'quote')
            .eq('status', 'pending'),
        ]);

        setRecent((recentRes.data ?? []) as DocumentWithCustomer[]);
        setStats({
          monthlyReports: monthlyRes.count ?? 0,
          activeQuotes: quotesRes.count ?? 0,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessProfile]);

  return { stats, recent, loading };
}
