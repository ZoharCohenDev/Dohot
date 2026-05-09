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

app.use(cors());
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
