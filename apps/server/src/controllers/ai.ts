import type { Request, Response } from 'express';
import { cleanReportText } from '../services/openai';

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
