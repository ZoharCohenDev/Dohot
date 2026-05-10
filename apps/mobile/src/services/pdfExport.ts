import { File, Directory, Paths } from 'expo-file-system';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import type { DocType } from '@/config/documentTypes';

const FALLBACK_CUSTOMER = 'לקוח ללא שם';

/**
 * Builds the human-readable PDF filename (without extension) from the wizard state.
 * Returns e.g. "ישראל ישראלי - דוח בדיקה"
 *
 * This is the single source of truth for PDF filenames — used for both the
 * local cache file (which WhatsApp shows to recipients) and the share dialog.
 */
export function buildPdfFilename(docType: DocType, customerName: string): string {
  const typeLabel = DOCUMENT_TYPES[docType]?.filenameLabel ?? 'דוח';
  const name = customerName.trim() || FALLBACK_CUSTOMER;
  return `${name} - ${typeLabel}`
    // Strip characters that are invalid on iOS / Android / Windows filesystems.
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Downloads a PDF from a server URL into the local cache directory.
 * The filename (without extension) should come from buildPdfFilename() so that
 * the name shown in WhatsApp and the native share sheet matches the document.
 * Overwrites any previous file with the same name (idempotent).
 * Returns the local file URI for use with expo-sharing.
 */
export async function downloadPdfToCache(pdfUrl: string, filename: string): Promise<string> {
  const dest = new File(Paths.cache, `${filename}.pdf`);
  if (dest.exists) dest.delete();
  const downloaded = await File.downloadFileAsync(pdfUrl, dest);
  return downloaded.uri;
}

/**
 * Removes all .pdf files from the app's private cache directory.
 * Safe to call broadly — no other app can write to our cache directory.
 */
export async function clearCachedPdfs(): Promise<void> {
  try {
    const files = new Directory(Paths.cache).list();
    for (const entry of files) {
      if (entry instanceof File && entry.uri.endsWith('.pdf')) {
        entry.delete();
      }
    }
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Removes a single cached PDF by its local URI.
 */
export function deleteCachedPdf(fileUri: string): void {
  try {
    const f = new File(fileUri);
    if (f.exists) f.delete();
  } catch {
    // Best-effort
  }
}
