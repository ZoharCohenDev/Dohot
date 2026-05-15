import { supabase } from '@/lib/supabase';
import type { Recommendation } from '@dohot/shared';

const SERVER_URL = process.env['EXPO_PUBLIC_API_URL']?.replace(/\/$/, '');

if (!SERVER_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL environment variable');
}

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
 *
 * Timing breakdown logged for each step:
 *   t_auth   — Supabase session lookup (local, should be <50ms)
 *   t_upload — Network: request sent → response headers received (TTFB)
 *   t_body   — JSON body read (small, <50ms unless network is degraded)
 *   t_total  — End-to-end wall-clock time
 *
 * Server-side timing is logged separately by the controller (see apps/server).
 * Compare t_upload against the server's processing time to isolate bottlenecks:
 *   - High t_upload + low server time → upload bandwidth is the bottleneck
 *   - Low t_upload + high server time → Whisper API is the bottleneck
 */
export async function transcribeAudioFile(localUri: string): Promise<string> {
  if (!localUri) throw new Error('אין קובץ הקלטה');

  const t0 = Date.now();
  console.log('[Transcribe] start, uri:', localUri);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('לא מחובר — יש להתחבר מחדש');
  const tAuth = Date.now();

  const formData = new FormData();
  formData.append('audio', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  console.log(`[Transcribe] auth=${tAuth - t0}ms, uploading → ${SERVER_URL}`);

  const response = await fetch(`${SERVER_URL}/api/ai/transcribe-audio`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const tUpload = Date.now();

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    const errMsg = payload.error ?? `Server error ${response.status}`;
    console.error(`[Transcribe] server error after ${tUpload - tAuth}ms:`, errMsg);
    throw new Error(errMsg);
  }

  const data = await response.json() as { text: string };
  const tBody = Date.now();

  console.log(
    `[Transcribe] done — auth=${tAuth - t0}ms, upload+server=${tUpload - tAuth}ms, ` +
    `body=${tBody - tUpload}ms, total=${tBody - t0}ms, chars=${data.text?.length ?? 0}`,
  );
  return data.text;
}

/** @deprecated Use transcribeAudioFile instead (FormData upload, no base64 overhead). */
export async function transcribeAudio(localUri: string): Promise<string> {
  return transcribeAudioFile(localUri);
}
