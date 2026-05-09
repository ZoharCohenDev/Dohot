import { File, Paths } from 'expo-file-system';

const getFile = () => new File(Paths.document, 'quote_followup.json');

export interface FollowUpEntry {
  completed: boolean;
  completedAt: string | null;
}

type FollowUpStore = Record<string, FollowUpEntry>;

async function read(): Promise<FollowUpStore> {
  const file = getFile();
  try {
    if (!file.exists) return {};
    const raw = await file.text();
    return JSON.parse(raw) as FollowUpStore;
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

export async function setFollowUp(documentId: string, completed: boolean): Promise<FollowUpStore> {
  const store = await read();
  store[documentId] = {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
  };
  write(store);
  return store;
}

export async function removeFollowUp(documentId: string): Promise<FollowUpStore> {
  const store = await read();
  delete store[documentId];
  write(store);
  return store;
}
