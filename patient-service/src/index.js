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

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`patient-service listening on port ${PORT}`);
});

export default app;
