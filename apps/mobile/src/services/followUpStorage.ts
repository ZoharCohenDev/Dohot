import { File, Paths } from 'expo-file-system';

export type QuoteStatus = 'waiting' | 'completed' | 'cancelled';

export interface FollowUpEntry {
  status: QuoteStatus;
  updatedAt: string | null;
}

type FollowUpStore = Record<string, FollowUpEntry>;

// Shape of entries written before the status field was introduced.
interface LegacyEntry {
  completed?: boolean;
  completedAt?: string | null;
  status?: QuoteStatus;
  updatedAt?: string | null;
}

const getFile = () => new File(Paths.document, 'quote_followup.json');

async function read(): Promise<FollowUpStore> {
  const file = getFile();
  try {
    if (!file.exists) return {};
    const raw = await file.text();
    const parsed = JSON.parse(raw) as Record<string, LegacyEntry>;

    const store: FollowUpStore = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (entry.status) {
        store[id] = { status: entry.status, updatedAt: entry.updatedAt ?? null };
      } else {
        // Migrate: completed:true → 'completed', false → 'waiting'
        store[id] = {
          status: entry.completed ? 'completed' : 'waiting',
          updatedAt: entry.completedAt ?? null,
        };
      }
    }
    return store;
  } catch {
    return {};
  }
}

function write(store: FollowUpStore): void {
  getFile().write(JSON.stringify(store));
}

export async function loadFollowUpStore(): Promise<FollowUpStore> {
  return read();
}

export async function setQuoteStatus(
  documentId: string,
  status: QuoteStatus,
): Promise<FollowUpStore> {
  const store = await read();
  store[documentId] = { status, updatedAt: new Date().toISOString() };
  write(store);
  return store;
}

export async function removeFollowUp(documentId: string): Promise<FollowUpStore> {
  const store = await read();
  delete store[documentId];
  write(store);
  return store;
}
