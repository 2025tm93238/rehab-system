import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();

app.use(cors());

// Health endpoint — does not depend on downstream services.
// Mounted before the proxies so it never gets forwarded.
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'ok',
    routes: {
      auth: '/api/auth/* -> auth-service',
      patients: '/api/patients/* -> patient-service',
      patientProgressTimeline: '/api/patients/:id/progress -> therapy-service',
      sessions: '/api/sessions/* -> therapy-service',
    },
  });
});

// Patient progress timeline lives on therapy-service even though the URL
// reads like patient-service — match it BEFORE the patient catch-all.
const isPatientProgressTimeline = (path) =>
  /^\/api\/patients\/\d+\/progress\/?$/.test(path);

// Proxies use http-proxy-middleware v3's pathFilter so they see the full
// /api/... path (Express prefix mounting would strip it before pathRewrite
// could run, breaking the rewrite).

// onProxyError sends a JSON 502 if the downstream service is unreachable,
// instead of letting the request hang or returning Express's HTML default.
function onProxyError(serviceName) {
  return (err, req, res) => {
    console.error(`[gateway] proxy error to ${serviceName}:`, err.code || err.message);
    if (res && !res.headersSent && typeof res.status === 'function') {
      res.status(502).json({
        error: 'upstream service unavailable',
        service: serviceName,
      });
    }
  };
}

const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/auth',
  pathRewrite: { '^/api/auth': '' },
  on: { error: onProxyError('auth-service') },
});

const patientProxy = createProxyMiddleware({
  target: process.env.PATIENT_SERVICE_URL,
  changeOrigin: true,
  pathFilter: (path) =>
    /^\/api\/patients(\/|$)/.test(path) && !isPatientProgressTimeline(path),
  pathRewrite: { '^/api': '' },
  on: { error: onProxyError('patient-service') },
});

const therapyProxy = createProxyMiddleware({
  target: process.env.THERAPY_SERVICE_URL,
  changeOrigin: true,
  pathFilter: (path) =>
    /^\/api\/sessions(\/|$)/.test(path) || isPatientProgressTimeline(path),
  pathRewrite: { '^/api': '' },
  on: { error: onProxyError('therapy-service') },
});

app.use(authProxy);
app.use(patientProxy);
app.use(therapyProxy);

// Fallback 404 for anything not matched by health or any proxy
app.use((req, res) => {
  res.status(404).json({ error: 'route not found at gateway', path: req.originalUrl });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`api-gateway listening on port ${PORT}`);
  console.log(`  -> auth     ${process.env.AUTH_SERVICE_URL}`);
  console.log(`  -> patient  ${process.env.PATIENT_SERVICE_URL}`);
  console.log(`  -> therapy  ${process.env.THERAPY_SERVICE_URL}`);
});

export default app;
