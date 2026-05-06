import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { documentsRouter } from './routes/documents';
import { pdfRouter } from './routes/pdf';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/documents', documentsRouter);
app.use('/api/pdf', pdfRouter);

app.listen(PORT, () => {
  console.log(`Dohot server running on port ${PORT}`);
});

export default app;
