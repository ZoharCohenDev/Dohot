import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import type { Recommendation } from '@dohot/shared';

const SERVER_URL = (process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000').replace(/\/$/, '');

export interface CleanReportResult {
  professionalText: string;
  recommendations: Recommendation[];
}

export async function cleanReportText(
  rawText: string,
  issueType: string,
): Promise<CleanReportResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('לא מחובר — יש להתחבר מחדש');

  const response = await fetch(`${SERVER_URL}/api/ai/clean-report-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rawText, issueType }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Server error ${response.status}`);
  }

  return response.json() as Promise<CleanReportResult>;
}

export async function transcribeAudio(localUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('לא מחובר — יש להתחבר מחדש');

  const response = await fetch(`${SERVER_URL}/api/ai/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ audio: base64 }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Server error ${response.status}`);
  }

  const data = await response.json() as { transcript: string };
  return data.transcript;
}
