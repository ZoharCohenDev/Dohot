import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generatePdfHandler, generatePdfFromCaptureHandler } from '../controllers/documents';

export const documentsRouter = Router();

documentsRouter.get('/', requireAuth, (_req, res) => {
  res.json({ documents: [] });
});

documentsRouter.post('/', requireAuth, (_req, res) => {
  res.status(201).json({ success: true });
});

documentsRouter.get('/:id', requireAuth, (req, res) => {
  res.json({ id: req.params['id'] });
});

documentsRouter.delete('/:id', requireAuth, (req, res) => {
  res.json({ deleted: req.params['id'] });
});

// Legacy server-template based generation (kept for admin/debug use)
documentsRouter.post('/:documentId/generate-pdf', requireAuth, generatePdfHandler);

// Primary generation: client sends a captured image of the preview screen.
// The PDF is literally the preview — no separate template.
documentsRouter.post('/:documentId/generate-pdf-from-capture', requireAuth, generatePdfFromCaptureHandler);
