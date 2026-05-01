import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

app.use('/', authRoutes);

// Catch-all 404 — return JSON instead of Express's HTML "Cannot GET ..." page.
app.use((req, res) => {
  res.status(404).json({ error: 'route not found', path: req.originalUrl });
});

// Global error handler — anything thrown / next(err) lands here as JSON 500.
// Without this, uncaught throws would surface Express's HTML stacktrace page.
app.use((err, req, res, next) => {
  console.error('[auth-service] unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});

export default app;
