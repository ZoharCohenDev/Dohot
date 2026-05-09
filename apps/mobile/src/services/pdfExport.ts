import { File, Directory, Paths } from 'expo-file-system';

const CACHE_PREFIX = 'dohot_pdf_';

function sanitizeFilename(title: string): string {
  return title
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Downloads a PDF from a server URL into the local cache directory.
 * Overwrites any previous file with the same name (idempotent).
 * Returns the local file URI for use with expo-sharing.
 */
export async function downloadPdfToCache(pdfUrl: string, docTitle: string): Promise<string> {
  const name = `${CACHE_PREFIX}${sanitizeFilename(docTitle)}.pdf`;
  const dest = new File(Paths.cache, name);
  // The native module throws if the destination already exists — delete it first.
  if (dest.exists) dest.delete();
  const downloaded = await File.downloadFileAsync(pdfUrl, dest);
  return downloaded.uri;
}

/**
 * Removes all cached PDFs that were created by this service.
 * Call on wizard reset or app cleanup.
 */
export async function clearCachedPdfs(): Promise<void> {
  try {
    const cacheDir = new Directory(Paths.cache);
    // List files in cache and delete any that match our prefix
    const files = cacheDir.list();
    for (const entry of files) {
      if (entry instanceof File && entry.uri.includes(CACHE_PREFIX)) {
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
