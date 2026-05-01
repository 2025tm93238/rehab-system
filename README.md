# Rehab Patient Tracking System

A full-stack web application for rehabilitation clinics to track patients, schedule therapy sessions, and monitor recovery progress over time. Built as the SE ZG503 — Full Stack Application Development assignment, BITS Pilani.

## Problem

Rehabilitation clinics often struggle to track patient therapy sessions, monitor recovery progress, and maintain structured records. Manual tracking leads to inconsistent documentation and poor visibility into patient outcomes. This system provides a centralized platform to manage patient registration, therapy sessions, and progress tracking with role-based access for therapists and administrators.

## What's in the box

- **3 backend microservices + 1 API gateway** (Node.js + Express, ESM, JWT auth)
- **PostgreSQL** for persistence — one shared DB, four tables, each service owns its own
- **React + Vite SPA** with React Router, Axios, an auth context, role-based protected routes
- **Cross-cutting features**: overlap-protected scheduling, recovery-arc trend chart, patient timeline view, dashboard stats

## Architecture (one-liner)

```
React Vite (5173)  →  API Gateway (4000)  →  auth-service (4001)
                                          →  patient-service (4002)
                                          →  therapy-service (4003)  →  PostgreSQL
```

Full diagrams and component hierarchy in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository layout

```
rehab-system/
├── api-gateway/        # Express proxy, port 4000
├── auth-service/       # users, register/login/JWT, port 4001
├── patient-service/    # patient CRUD, port 4002
├── therapy-service/    # sessions + progress entries + patient timeline, port 4003
├── frontend/           # React + Vite SPA, port 5173
└── docs/
    ├── ARCHITECTURE.md
    ├── DB_SCHEMA.md
    ├── API.md
    ├── ASSUMPTIONS.md
    └── AI_USAGE.md
```

Each service is self-contained: own `package.json`, own `db/schema.sql`, own `.env` template, own README with curl examples.

## Tech stack

- **Frontend**: React 19, Vite, React Router 7, Axios
- **Backend**: Node.js 22, Express 5
- **Auth**: JSON Web Tokens (HS256), bcryptjs
- **DB**: PostgreSQL 17
- **Proxy**: http-proxy-middleware v3 (gateway)

## Getting started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 with a superuser (`postgres`) accessible on `localhost:5432`

### 1. Clone and install

```bash
git clone <this-repo>
cd rehab-system

# Install per-service deps (each is independent)
( cd auth-service     && npm install )
( cd patient-service  && npm install )
( cd therapy-service  && npm install )
( cd api-gateway      && npm install )
( cd frontend         && npm install )
```

### 2. Create the database and apply schemas

```bash
# Use your own postgres password
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE rehab_db;"

PGPASSWORD=postgres psql -h localhost -U postgres -d rehab_db -f auth-service/db/schema.sql
PGPASSWORD=postgres psql -h localhost -U postgres -d rehab_db -f patient-service/db/schema.sql
PGPASSWORD=postgres psql -h localhost -U postgres -d rehab_db -f therapy-service/db/schema.sql
```

### 3. Configure environment files

Each service has a `.env.example` — copy it to `.env` and fill in your DB credentials. The `JWT_SECRET` must be **identical** in `auth-service/.env`, `patient-service/.env`, and `therapy-service/.env`.

```bash
for d in auth-service patient-service therapy-service api-gateway frontend; do
  cp $d/.env.example $d/.env
done
```

### 4. Run all 5 processes (5 terminals)

```bash
# Terminal 1
( cd auth-service     && npm start )       # listens on :4001

# Terminal 2
( cd patient-service  && npm start )       # listens on :4002

# Terminal 3
( cd therapy-service  && npm start )       # listens on :4003

# Terminal 4
( cd api-gateway      && npm start )       # listens on :4000

# Terminal 5
( cd frontend         && npm run dev )     # listens on :5173
```

Open http://localhost:5173/ — you'll be redirected to `/login`.

### 5. First-run smoke test

```bash
# Register a therapist via the API
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Therapist","email":"jane@clinic.test","password":"secret123","role":"therapist"}'

# Or sign up through the UI on http://localhost:5173/signup
```

Then log in with those credentials. Try:
1. Register a patient
2. Schedule a therapy session for that patient — try scheduling an **overlapping** session for the same therapist; it should be rejected with a 409
3. Mark the session "completed" → record progress (pain + mobility sliders)
4. Open the patient detail page → see the progress timeline with the trend chart

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system topology, component hierarchy, key data flows
- [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) — all four tables with constraints, indexes, FK behaviours, ER diagram
- [`docs/API.md`](docs/API.md) — every endpoint with request/response shape and error codes
- [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) — design decisions, alternatives considered, what's deliberately out of scope
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — log of AI-assisted development (prompts + manual decisions)

Each service folder also has its own `README.md` with curl examples specific to that service.

## Assignment deliverables

| Deliverable | Where |
|---|---|
| Source code | this repo |
| API docs | [`docs/API.md`](docs/API.md) |
| DB schema diagram | [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) |
| Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Assumptions | [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) |
| AI usage log + reflection | [`docs/AI_USAGE.md`](docs/AI_USAGE.md) |
| Demo video | (Google Drive link — see submission portal) |

## Course

BITS Pilani — SE ZG503, Full Stack Application Development, II SEM 2025–2026.
