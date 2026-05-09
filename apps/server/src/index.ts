import express from 'express';
import cors from 'cors';
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

app.use('/api/documents', documentsRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Dohot server running on port ${PORT}`);
});

export default app;
