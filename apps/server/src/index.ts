import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { documentsRouter } from './routes/documents';
import { pdfRouter } from './routes/pdf';
import { aiRouter } from './routes/ai';
import { adminRouter } from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] ?? 3000;

const allowedOrigins = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:8081'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// AI endpoints hit paid third-party APIs — rate limit tightly per IP.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});

// PDF generation launches Puppeteer — limit to avoid resource exhaustion.
const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});

// Admin endpoints are low-volume by nature; this primarily blocks brute-force
// attempts against user creation and password-reset routes.
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});

app.use('/api/documents', pdfLimiter, documentsRouter);
app.use('/api/pdf', pdfLimiter, pdfRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/admin', adminLimiter, adminRouter);

app.listen(PORT, () => {
  console.log(`Dohot server running on port ${PORT}`);
});

export default app;
