import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import {
  cleanReportTextHandler,
  transcribeHandler,
  transcribeAudioFileHandler,
} from '../controllers/ai';

export const aiRouter = Router();

// In-memory storage — file is available as req.file.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (OpenAI's limit)
});

aiRouter.post('/clean-report-text', requireAuth, cleanReportTextHandler);
aiRouter.post('/transcribe', requireAuth, transcribeHandler);
aiRouter.post('/transcribe-audio', requireAuth, upload.single('audio'), transcribeAudioFileHandler);
