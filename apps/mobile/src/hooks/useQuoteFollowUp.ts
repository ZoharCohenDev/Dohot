import { useState, useEffect, useCallback } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Document } from '@dohot/shared';
import {
  loadFollowUpStore,
  setFollowUp,
  removeFollowUp,
  type FollowUpEntry,
} from '@/services/followUpStorage';
import { deleteDocument } from '@/services/documents';

export type QuoteWithCustomer = Document & {
  customers: {
    name: string;
    phone: string | null;
    city: string | null;
    street: string | null;
    house_number: string | null;
    apartment: string | null;
    floor: string | null;
    address: string | null;
  } | null;
};

export type QuoteFollowUpItem = QuoteWithCustomer & {
  followUp: FollowUpEntry;
};

function sortQuotes(items: QuoteFollowUpItem[]): QuoteFollowUpItem[] {
  const open = items
    .filter((q) => !q.followUp.completed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const done = items
    .filter((q) => q.followUp.completed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return [...open, ...done];
}

export function useQuoteFollowUp() {
  const { businessProfile } = useAuth();
  const [quotes, setQuotes] = useState<QuoteWithCustomer[]>([]);
  const [followUpStore, setFollowUpStore] = useState<Record<string, FollowUpEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!businessProfile) return;
    setLoading(true);
    setError('');
    try {
      const [{ data, error: qErr }, store] = await Promise.all([
        supabase
          .from(tables.documents)
          .select('*, customers(name, phone, city, street, house_number, apartment, floor, address)')
          .eq('professional_id', businessProfile.id)
          .eq('type', 'quote')
          .not('pdf_url', 'is', null)
          .order('created_at', { ascending: false }),
        loadFollowUpStore(),
      ]);
      if (qErr) throw qErr;
      setQuotes((data ?? []) as QuoteWithCustomer[]);
      setFollowUpStore(store);
    } catch {
      setError('לא ניתן לטעון הצעות מחיר');
    } finally {
      setLoading(false);
    }
  }, [businessProfile]);

  useEffect(() => { load(); }, [load]);

  const toggleFollowUp = useCallback(async (documentId: string) => {
    const current = followUpStore[documentId]?.completed ?? false;
    const updated = await setFollowUp(documentId, !current);
    setFollowUpStore(updated);
  }, [followUpStore]);

  const deleteQuote = useCallback(async (documentId: string) => {
    await deleteDocument(documentId);
    const updated = await removeFollowUp(documentId);
    setFollowUpStore(updated);
    setQuotes((prev) => prev.filter((q) => q.id !== documentId));
  }, []);

  const items: QuoteFollowUpItem[] = sortQuotes(
    quotes.map((q) => ({
      ...q,
      followUp: followUpStore[q.id] ?? { completed: false, completedAt: null },
    })),
  );

  return { items, loading, error, refetch: load, toggleFollowUp, deleteQuote };
}
