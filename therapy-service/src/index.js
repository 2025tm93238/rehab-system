import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessions.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'therapy-service', status: 'ok' });
});

app.use('/sessions', sessionRoutes);

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`therapy-service listening on port ${PORT}`);
});

export default app;
