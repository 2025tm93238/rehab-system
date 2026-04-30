# Auth Service

Handles user registration, login, and JWT-based authentication. Supports two roles: `admin` and `therapist`.

- Port: `4001`
- Endpoints:
  - `GET  /health` — service health probe
  - `POST /register` — register a new user (implemented)
  - `POST /login` — authenticate and return a JWT (next phase)
  - `GET  /me` — return the current user (next phase)

## Database setup (one-time)

```bash
# Create the shared database
psql -h localhost -U postgres -c "CREATE DATABASE rehab_db;"

# Apply this service's schema
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

## Try the register endpoint

```bash
curl -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Therapist",
    "email": "jane@clinic.test",
    "password": "secret123",
    "role": "therapist"
  }'
```

Response (201):
```json
{
  "id": 1,
  "name": "Jane Therapist",
  "email": "jane@clinic.test",
  "role": "therapist",
  "created_at": "2026-04-30T..."
}
```

Validation errors return `400`. Duplicate emails return `409`.
