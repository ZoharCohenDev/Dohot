import { useState, useEffect, useCallback } from 'react';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Document } from '@dohot/shared';
import {
  loadFollowUpStore,
  setQuoteStatus as persistQuoteStatus,
  removeFollowUp,
  type FollowUpEntry,
  type QuoteStatus,
} from '@/services/followUpStorage';
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

const DEFAULT_FOLLOW_UP: FollowUpEntry = { status: 'waiting', updatedAt: null };

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
  const [followUpStore, setFollowUpStore] = useState<Record<string, FollowUpEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');

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

  const setQuoteStatus = useCallback(async (documentId: string, status: QuoteStatus) => {
    const updated = await persistQuoteStatus(documentId, status);
    setFollowUpStore(updated);
  }, []);

  const deleteQuote = useCallback(async (documentId: string) => {
    await deleteDocument(documentId);
    const updated = await removeFollowUp(documentId);
    setFollowUpStore(updated);
    setQuotes((prev) => prev.filter((q) => q.id !== documentId));
  }, []);

  const allItems = sortQuotes(
    quotes.map((q) => ({
      ...q,
      followUp: followUpStore[q.id] ?? DEFAULT_FOLLOW_UP,
    })),
  );

  const items = filterQuotesByStatus(allItems, statusFilter);

  const counts: Record<QuoteStatusFilter, number> = {
    all: allItems.length,
    waiting: allItems.filter((q) => q.followUp.status === 'waiting').length,
    completed: allItems.filter((q) => q.followUp.status === 'completed').length,
    cancelled: allItems.filter((q) => q.followUp.status === 'cancelled').length,
  };

  return {
    items,
    counts,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch: load,
    setQuoteStatus,
    deleteQuote,
  };
}
