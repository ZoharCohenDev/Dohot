import type { Request, Response } from 'express';
import { cleanReportText, transcribeAudio, transcribeAudioBuffer } from '../services/openai';

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

  try {
    const result = await cleanReportText(body.rawText, body.issueType);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI processing failed';
    console.error('[AI] cleanReportText error:', message);
    res.status(500).json({ error: message });
  }
}

export async function transcribeHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as { audio?: unknown };
  if (typeof body.audio !== 'string' || !body.audio) {
    res.status(400).json({ error: 'audio must be a non-empty base64 string' });
    return;
  }
  try {
    const transcript = await transcribeAudio(body.audio);
    res.json({ transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    console.error('[AI] transcribe error:', message);
    res.status(500).json({ error: message });
  }
}

// Accepts multipart/form-data with an `audio` file field.
// Returns { text: string }.
export async function transcribeAudioFileHandler(req: Request, res: Response): Promise<void> {
  const file = req.file;
  console.log('[AI] transcribe-audio: request received');

  if (!file) {
    console.error('[AI] transcribe-audio: no file in request');
    res.status(400).json({ error: 'No audio file uploaded. Send multipart/form-data with field "audio".' });
    return;
  }

  console.log('[AI] transcribe-audio: file received —', file.originalname, file.size, 'bytes', file.mimetype);

  try {
    console.log('[OpenAI] transcribe-audio: calling Whisper...');
    const text = await transcribeAudioBuffer(file.buffer, file.originalname);
    console.log('[AI] transcribe-audio: success, text length:', text.length);
    res.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    console.error('[AI] transcribe-audio error:', message);
    res.status(500).json({ error: message });
  }
}
