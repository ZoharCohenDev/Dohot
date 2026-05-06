import { Router } from 'express';

export const documentsRouter = Router();

documentsRouter.get('/', (_req, res) => {
  res.json({ documents: [] });
});

documentsRouter.post('/', (_req, res) => {
  res.status(201).json({ success: true });
});

documentsRouter.get('/:id', (req, res) => {
  res.json({ id: req.params['id'] });
});

documentsRouter.delete('/:id', (req, res) => {
  res.json({ deleted: req.params['id'] });
});
