import { useState, useEffect, useCallback } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Customer, CustomerType } from '@dohot/shared';

export function useCustomers(search = '', typeFilter?: CustomerType) {
  const { businessProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!businessProfile) return;
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from(tables.customers)
        .select('*', { count: 'exact' })
        .eq('professional_id', businessProfile.id)
        .order('last_contact_at', { ascending: false, nullsFirst: false });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error: queryError, count } = await query;
      if (queryError) throw queryError;
      setCustomers((data ?? []) as Customer[]);
      setTotal(count ?? 0);
    } catch {
      setError('לא ניתן לטעון לקוחות');
    } finally {
      setLoading(false);
    }
  }, [businessProfile, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return { customers, total, loading, error, refetch: load };
}
