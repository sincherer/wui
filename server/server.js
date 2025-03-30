import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
import { surgeAuthRouter } from './routes/auth/surgeAuth.js';
import surgeRouter from './routes/deploy/surge.js';
import websiteRouter from './routes/website.js';
import { vercelAuthRouter } from './routes/auth/vercelAuth.js';

// Serve static files from Vite build
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, '../dist')));

app.use(express.json());
import cors from 'cors';

app.use('/api/auth/surge', cors({
  credentials: true,
  origin: 'http://localhost:5173'
}), surgeAuthRouter);
app.use('/api/auth/vercel', cors({
  credentials: true,
  origin: 'http://localhost:5173'
}), vercelAuthRouter);
app.use('/api/deploy', surgeRouter);
app.use('/website', websiteRouter);

const PORT = process.env.PORT || 5174;
// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});