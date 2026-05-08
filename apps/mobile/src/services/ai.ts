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
