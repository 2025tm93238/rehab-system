# API Gateway

Single entry point for the frontend. Proxies incoming requests to the appropriate backend microservice. Frontend never talks to a service directly — only through the gateway.

- Port: `4000`
- Health: `GET /health`

## Route table

| Frontend URL | Proxied to | Final URL on service |
|---|---|---|
| `POST /api/auth/register`         | auth-service (4001)    | `POST /register` |
| `POST /api/auth/login`            | auth-service (4001)    | `POST /login` |
| `GET  /api/auth/me`               | auth-service (4001)    | `GET /me` |
| `*    /api/patients`              | patient-service (4002) | `* /patients` |
| `*    /api/patients/:id`          | patient-service (4002) | `* /patients/:id` |
| `GET  /api/patients/:id/progress` | **therapy-service (4003)** | `GET /patients/:id/progress` |
| `*    /api/sessions/...`          | therapy-service (4003) | `* /sessions/...` |

The `/api/patients/:id/progress` route is matched **before** the general `/api/patients` catch-all and forwarded to therapy-service, because the patient progress timeline is therapy data.

## Local setup

```bash
cd api-gateway
npm install
cp .env.example .env       # adjust service URLs if needed
npm start
```

The gateway expects the three downstream services to be running. Bring them all up:

```bash
# in 4 different terminals
( cd auth-service && npm start )
( cd patient-service && npm start )
( cd therapy-service && npm start )
( cd api-gateway && npm start )
```

## Try it end-to-end through the gateway

```bash
# Login through the gateway
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@clinic.test","password":"secret123"}' | jq -r .token)

# List patients through the gateway
curl http://localhost:4000/api/patients -H "Authorization: Bearer $TOKEN"

# Patient progress timeline (proxied to therapy-service)
curl http://localhost:4000/api/patients/1/progress -H "Authorization: Bearer $TOKEN"

# Schedule a session through the gateway
curl -X POST http://localhost:4000/api/sessions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patient_id":1,"therapist_id":1,"scheduled_at":"2026-05-23T10:00:00Z","duration_minutes":45,"session_type":"physiotherapy"}'
```

## Auth model

The gateway is a **transparent proxy** — it does NOT verify JWTs. The `Authorization` header is forwarded as-is to the downstream service, which verifies the token using the shared `JWT_SECRET`. This keeps the gateway stateless and simple.
