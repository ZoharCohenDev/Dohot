import { Router } from 'express';

export const pdfRouter = Router();

pdfRouter.post('/generate', (_req, res) => {
  res.json({ url: null, message: 'PDF generation not yet implemented' });
});
