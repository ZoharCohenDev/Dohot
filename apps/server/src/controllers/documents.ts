import type { Request, Response } from 'express';
import {
  fetchDocumentData,
  buildHtml,
  renderPdf,
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
