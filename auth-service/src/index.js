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

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});

export default app;
