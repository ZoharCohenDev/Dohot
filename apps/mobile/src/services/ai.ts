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

/**
 * Upload a local audio file to the backend for transcription via OpenAI Whisper.
 * Uses multipart/form-data so React Native can stream the file without base64 overhead.
 */
export async function transcribeAudioFile(localUri: string): Promise<string> {
  console.log('[Transcribe] recordedAudioUri:', localUri);

  if (!localUri) throw new Error('אין קובץ הקלטה');

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('לא מחובר — יש להתחבר מחדש');

  // React Native's fetch supports appending { uri, name, type } to FormData
  // — the native layer reads the file and streams it as multipart.
  const formData = new FormData();
  formData.append('audio', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  console.log('[Transcribe] File upload started →', SERVER_URL);

  const response = await fetch(`${SERVER_URL}/api/ai/transcribe-audio`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type manually — fetch sets it with the multipart boundary automatically
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  console.log('[Transcribe] Server response status:', response.status);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    const errMsg = payload.error ?? `Server error ${response.status}`;
    console.error('[Transcribe] Server error:', errMsg);
    throw new Error(errMsg);
  }

  const data = await response.json() as { text: string };
  console.log('[Transcribe] Transcription result length:', data.text?.length ?? 0);
  return data.text;
}

/** @deprecated Use transcribeAudioFile instead (FormData upload, no base64 overhead). */
export async function transcribeAudio(localUri: string): Promise<string> {
  return transcribeAudioFile(localUri);
}
