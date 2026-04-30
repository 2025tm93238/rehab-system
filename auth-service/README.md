# Auth Service

Handles user registration, login, and JWT-based authentication. Supports two roles: `admin` and `therapist`.

- Port: `4001`
- Endpoints (planned):
  - `POST /register` — register a new user (admin or therapist)
  - `POST /login` — authenticate and return a JWT
  - `GET /me` — return the current user (verified via JWT)
- Currently implemented:
  - `GET /health` — service health probe

## Setup

```bash
cd auth-service
npm install
cp .env.example .env       # then edit .env with real DB credentials and JWT secret
npm start
```

The service will start on `http://localhost:4001`. Verify with:

```bash
curl http://localhost:4001/health
# { "service": "auth-service", "status": "ok" }
```
