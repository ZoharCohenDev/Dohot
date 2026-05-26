import { useState, useEffect, useCallback } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Customer, CustomerType } from '@dohot/shared';

export interface CustomerWithStats extends Customer {
  documentCount: number;
}

export function useCustomers(search = '', typeFilter?: CustomerType) {
  const { businessProfile } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profileId = businessProfile?.id;

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from(tables.customers)
        .select('*, documents!customer_id(count)', { count: 'exact' })
        .eq('professional_id', profileId)
        .order('last_contact_at', { ascending: false, nullsFirst: false });

      if (typeFilter) query = query.eq('type', typeFilter);
      if (search.trim()) {
        const q = search.trim();
        query = query.or(
          `name.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`
        );
      }

      const { data, error: queryError, count } = await query;
      if (queryError) throw queryError;

      type RawRow = Customer & { documents: { count: number }[] };
      const mapped: CustomerWithStats[] = ((data ?? []) as unknown as RawRow[]).map((row) => ({
        ...row,
        documentCount: row.documents?.[0]?.count ?? 0,
      }));

      setCustomers(mapped);
      setTotal(count ?? 0);
    } catch {
      setError('לא ניתן לטעון לקוחות');
    } finally {
      setLoading(false);
    }
  }, [profileId, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return { customers, total, loading, error, refetch: load };
}
