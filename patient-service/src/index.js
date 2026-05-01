import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import patientRoutes from './routes/patients.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'patient-service', status: 'ok' });
});

app.use('/patients', patientRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('[patient-service] unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`patient-service listening on port ${PORT}`);
});

export default app;
