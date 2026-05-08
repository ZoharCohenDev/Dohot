import { useState, useEffect, useCallback } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Document, DocumentType } from '@dohot/shared';

export type DocumentWithCustomer = Document & {
  customers: { name: string } | null;
};

export function useDocuments(typeFilter?: DocumentType) {
  const { businessProfile } = useAuth();
  const [documents, setDocuments] = useState<DocumentWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!businessProfile) return;
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from(tables.documents)
        .select('*, customers(name)')
        .eq('professional_id', businessProfile.id)
        .order('created_at', { ascending: false });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setDocuments((data ?? []) as DocumentWithCustomer[]);
    } catch {
      setError('לא ניתן לטעון מסמכים');
    } finally {
      setLoading(false);
    }
  }, [businessProfile, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return { documents, loading, error, refetch: load };
}
