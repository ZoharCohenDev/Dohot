import type { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../lib/supabase';

declare global {
  // Express uses declaration merging for request-scoped fields.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware that reads the Authorization header, validates the Supabase JWT,
 * and attaches req.userId. Returns 401 if the token is missing or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = user.id;
  next();
}
