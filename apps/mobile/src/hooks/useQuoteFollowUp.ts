import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Document } from '@dohot/shared';
import type { FollowUpEntry, QuoteStatus } from '@/services/followUpStorage';
import { deleteDocument } from '@/services/documents';

export type { QuoteStatus, FollowUpEntry };
export type QuoteStatusFilter = 'all' | QuoteStatus;

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

// Sort: waiting first, then completed, then cancelled; newest-first within each group.
const STATUS_ORDER: Record<QuoteStatus, number> = { waiting: 0, completed: 1, cancelled: 2 };

function sortQuotes(items: QuoteFollowUpItem[]): QuoteFollowUpItem[] {
  return [...items].sort((a, b) => {
    const diff = STATUS_ORDER[a.followUp.status] - STATUS_ORDER[b.followUp.status];
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function filterQuotesByStatus(
  items: QuoteFollowUpItem[],
  filter: QuoteStatusFilter,
): QuoteFollowUpItem[] {
  if (filter === 'all') return items;
  return items.filter((q) => q.followUp.status === filter);
}

export function useQuoteFollowUp() {
  const { businessProfile } = useAuth();
  const [quotes, setQuotes] = useState<QuoteWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');

  const profileId = businessProfile?.id;

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: qErr } = await supabase
        .from(tables.documents)
        .select('*, customers(name, phone, city, street, house_number, apartment, floor, address)')
        .eq('professional_id', profileId)
        .eq('type', 'quote')
        .not('pdf_url', 'is', null)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setQuotes((data ?? []) as QuoteWithCustomer[]);
    } catch {
      setError('לא ניתן לטעון הצעות מחיר');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const setQuoteStatus = useCallback(async (documentId: string, status: QuoteStatus) => {
    if (!profileId) return;
    setSavingIds((prev) => new Set(prev).add(documentId));
    try {
      const { error: updateErr } = await supabase
        .from(tables.documents)
        .update({ quote_status: status })
        .eq('id', documentId)
        .eq('professional_id', profileId);
      if (updateErr) throw updateErr;
      // Optimistically update local state only after confirmed DB write.
      setQuotes((prev) =>
        prev.map((q) => (q.id === documentId ? { ...q, quote_status: status } : q)),
      );
    } finally {
      setSavingIds((prev) => { const s = new Set(prev); s.delete(documentId); return s; });
    }
  }, [profileId]);

  const deleteQuote = useCallback(async (documentId: string) => {
    await deleteDocument(documentId);
    setQuotes((prev) => prev.filter((q) => q.id !== documentId));
  }, []);

  // Memoised: only recompute when the raw quotes array changes.
  const allItems = useMemo(
    () =>
      sortQuotes(
        quotes.map((q) => ({
          ...q,
          followUp: {
            status: (q.quote_status ?? 'waiting') as QuoteStatus,
            updatedAt: q.updated_at,
          },
        })),
      ),
    [quotes],
  );

  // Memoised: only refilter when allItems or the active filter changes.
  const items = useMemo(
    () => filterQuotesByStatus(allItems, statusFilter),
    [allItems, statusFilter],
  );

  // Memoised: badge counts only recalculate when allItems changes.
  const counts: Record<QuoteStatusFilter, number> = useMemo(
    () => ({
      all: allItems.length,
      waiting: allItems.filter((q) => q.followUp.status === 'waiting').length,
      completed: allItems.filter((q) => q.followUp.status === 'completed').length,
      cancelled: allItems.filter((q) => q.followUp.status === 'cancelled').length,
    }),
    [allItems],
  );

  return {
    items,
    counts,
    loading,
    error,
    savingIds,
    statusFilter,
    setStatusFilter,
    refetch: load,
    setQuoteStatus,
    deleteQuote,
  };
}
