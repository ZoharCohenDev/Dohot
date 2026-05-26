// Types only — persistence is handled by Supabase (documents.quote_status column).
// Kept as a module so existing imports of QuoteStatus / FollowUpEntry continue to work.

export type QuoteStatus = 'waiting' | 'completed' | 'cancelled';

export interface FollowUpEntry {
  status: QuoteStatus;
  updatedAt: string | null;
}
