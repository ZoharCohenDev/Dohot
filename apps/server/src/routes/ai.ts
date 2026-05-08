import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { cleanReportTextHandler } from '../controllers/ai';

export const aiRouter = Router();

aiRouter.post('/clean-report-text', requireAuth, cleanReportTextHandler);
