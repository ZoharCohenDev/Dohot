import type { Request, Response } from 'express';
import {
  fetchDocumentData,
  buildHtml,
  renderPdf,
  renderPdfFromImage,
  renderPdfFromImages,
  uploadPdf,
  savePdfUrl,
} from '../services/pdf';
import { supabaseAdmin } from '../lib/supabase';

export async function generatePdfHandler(req: Request, res: Response): Promise<void> {
  const { documentId } = req.params as { documentId: string };
  const userId = req.userId!;

  try {
    const data = await fetchDocumentData(documentId, userId);
    const html = buildHtml(data);
    const pdfBuffer = await renderPdf(html);
    const pdfUrl = await uploadPdf(pdfBuffer, userId, documentId);
    await savePdfUrl(documentId, userId, pdfUrl);

    res.json({ url: pdfUrl });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    console.error('[PDF] generatePdf error:', message);
    res.status(status).json({ error: message });
  }
}

/**
 * Generates a PDF from a client-captured image of the preview screen.
 * Body: { imageBase64: string, mimeType?: 'image/jpeg' | 'image/png' }
 *
 * This produces a PDF that is pixel-for-pixel identical to the React Native
 * preview — no separate server-side template is involved.
 */
export async function generatePdfFromCaptureHandler(req: Request, res: Response): Promise<void> {
  const { documentId } = req.params as { documentId: string };
  const userId = req.userId!;

  const { images, mimeType = 'image/jpeg' } = req.body as {
    images?: string[];
    mimeType?: 'image/jpeg' | 'image/png';
  };

  if (!Array.isArray(images) || images.length === 0) {
    res.status(400).json({ error: 'images array is required' });
    return;
  }

  try {
    // Verify the document belongs to the authenticated user before writing anything.
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('professional_id', userId)
      .maybeSingle();

    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const pdfBuffer = images.length === 1
      ? await renderPdfFromImage(images[0]!, mimeType)
      : await renderPdfFromImages(images, mimeType);
    const pdfUrl = await uploadPdf(pdfBuffer, userId, documentId);
    await savePdfUrl(documentId, userId, pdfUrl);

    res.json({ url: pdfUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF generation from capture failed';
    console.error('[PDF] generatePdfFromCapture error:', message);
    res.status(500).json({ error: message });
  }
}
