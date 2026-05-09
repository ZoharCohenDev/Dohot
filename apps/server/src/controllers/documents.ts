import type { Request, Response } from 'express';
import {
  fetchDocumentData,
  buildHtml,
  renderPdf,
  renderPdfFromImage,
  uploadPdf,
  savePdfUrl,
} from '../services/pdf';

export async function generatePdfHandler(req: Request, res: Response): Promise<void> {
  const { documentId } = req.params as { documentId: string };
  const userId = req.userId!;

  try {
    const data = await fetchDocumentData(documentId, userId);
    const html = buildHtml(data);
    const pdfBuffer = await renderPdf(html);
    const pdfUrl = await uploadPdf(pdfBuffer, userId, documentId);
    await savePdfUrl(documentId, pdfUrl);

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

  const { imageBase64, mimeType = 'image/jpeg' } = req.body as {
    imageBase64?: string;
    mimeType?: 'image/jpeg' | 'image/png';
  };

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }

  try {
    const pdfBuffer = await renderPdfFromImage(imageBase64, mimeType);
    const pdfUrl = await uploadPdf(pdfBuffer, userId, documentId);
    await savePdfUrl(documentId, pdfUrl);

    res.json({ url: pdfUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF generation from capture failed';
    console.error('[PDF] generatePdfFromCapture error:', message);
    res.status(500).json({ error: message });
  }
}
