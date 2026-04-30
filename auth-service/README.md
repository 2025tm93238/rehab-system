# Auth Service

Handles user registration, login, and JWT-based authentication. Supports two roles: `admin` and `therapist`.

- Port: `4001`
- Endpoints:
  - `GET  /health` — service health probe
  - `POST /register` — register a new user
  - `POST /login` — authenticate and return a JWT
  - `GET  /me` — return the current user (requires `Authorization: Bearer <token>`)

## Database setup (one-time)

```bash
psql -h localhost -U postgres -c "CREATE DATABASE rehab_db;"
psql -h localhost -U postgres -d rehab_db -f auth-service/db/schema.sql
```

## Local setup

```bash
cd auth-service
npm install
cp .env.example .env       # then edit .env with real DB credentials and JWT secret
npm start
```

The service starts on `http://localhost:4001`.

## Try the endpoints

### Register

```bash
curl -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Therapist","email":"jane@clinic.test","password":"secret123","role":"therapist"}'
```

Response (201):
```json
{ "id": 1, "name": "Jane Therapist", "email": "jane@clinic.test", "role": "therapist", "created_at": "..." }
```

### Login

```bash
curl -X POST http://localhost:4001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@clinic.test","password":"secret123"}'
```

Response (200):
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "Jane Therapist", "email": "jane@clinic.test", "role": "therapist" }
}
```

### Get current user

```bash
TOKEN="<paste token from login>"
curl http://localhost:4001/me -H "Authorization: Bearer $TOKEN"
```

## Auth middleware (shared)

`src/middleware/authMiddleware.js` exports `requireAuth` (verifies JWT, populates `req.user`) and `requireRole(...allowedRoles)` (gates by role). The same middleware logic is reused by `patient-service` and `therapy-service`.
