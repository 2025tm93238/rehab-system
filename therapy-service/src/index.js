import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessions.js';
import patientProgressRoutes from './routes/patientProgress.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'therapy-service', status: 'ok' });
});

app.use('/sessions', sessionRoutes);
app.use('/patients', patientProgressRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('[therapy-service] unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`therapy-service listening on port ${PORT}`);
});

export default app;
