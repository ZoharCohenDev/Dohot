import type { Request, Response } from 'express';
import { cleanReportText, transcribeAudio, transcribeAudioBuffer } from '../services/openai';
import { logger } from '../lib/logger';

export async function cleanReportTextHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as { rawText?: unknown; issueType?: unknown };

  if (typeof body.rawText !== 'string' || !body.rawText.trim()) {
    res.status(400).json({ error: 'rawText must be a non-empty string' });
    return;
  }
  if (typeof body.issueType !== 'string' || !body.issueType.trim()) {
    res.status(400).json({ error: 'issueType must be a non-empty string' });
    return;
  }

  logger.info({ issueType: body.issueType }, 'AI clean-report-text started');
  const tStart = Date.now();
  try {
    const result = await cleanReportText(body.rawText, body.issueType);
    logger.info({ issueType: body.issueType, durationMs: Date.now() - tStart }, 'AI clean-report-text succeeded');
    res.json(result);
  } catch (err) {
    logger.error({ err, issueType: body.issueType, durationMs: Date.now() - tStart }, 'AI clean-report-text failed');
    res.status(500).json({ error: 'AI processing failed' });
  }
}

export async function transcribeHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as { audio?: unknown };
  if (typeof body.audio !== 'string' || !body.audio) {
    res.status(400).json({ error: 'audio must be a non-empty base64 string' });
    return;
  }
  logger.info('AI transcribe (base64) started');
  const tStart = Date.now();
  try {
    const transcript = await transcribeAudio(body.audio);
    logger.info({ durationMs: Date.now() - tStart }, 'AI transcribe (base64) succeeded');
    res.json({ transcript });
  } catch (err) {
    logger.error({ err, durationMs: Date.now() - tStart }, 'AI transcribe (base64) failed');
    res.status(500).json({ error: 'Transcription failed' });
  }
}

// Accepts multipart/form-data with an `audio` file field.
// Returns { text: string }.
export async function transcribeAudioFileHandler(req: Request, res: Response): Promise<void> {
  const tStart = Date.now();
  const file = req.file;

  if (!file) {
    logger.warn('AI transcribe-audio: no file in request');
    res.status(400).json({ error: 'No audio file uploaded. Send multipart/form-data with field "audio".' });
    return;
  }

  const fileSizeKb = Math.round(file.size / 1024);
  logger.info({ originalName: file.originalname, sizeKb: fileSizeKb, mimeType: file.mimetype }, 'AI transcribe-audio started');

  try {
    const tWhisperStart = Date.now();
    const text = await transcribeAudioBuffer(file.buffer, file.originalname);
    const tWhisperEnd = Date.now();

    logger.info({
      originalName: file.originalname,
      sizeKb: fileSizeKb,
      multerMs: tWhisperStart - tStart,
      whisperMs: tWhisperEnd - tWhisperStart,
      totalMs: tWhisperEnd - tStart,
      chars: text.length,
    }, 'AI transcribe-audio succeeded');
    res.json({ text });
  } catch (err) {
    logger.error({ err, originalName: file.originalname, sizeKb: fileSizeKb, durationMs: Date.now() - tStart }, 'AI transcribe-audio failed');
    res.status(500).json({ error: 'Transcription failed' });
  }
}
