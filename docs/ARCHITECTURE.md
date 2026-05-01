# Architecture

## System diagram

```
                        ┌──────────────────────────┐
                        │    React + Vite SPA      │
                        │   (port 5173, dev only)  │
                        └─────────────┬────────────┘
                                      │  fetch /api/...
                                      │  (Vite dev proxy →)
                                      ▼
                        ┌──────────────────────────┐
                        │       API Gateway        │
                        │     (Express, port 4000) │
                        │   pathFilter routing     │
                        └────┬───────┬─────────┬───┘
              /api/auth/*    │       │         │   /api/sessions/*
                             │       │         │   /api/patients/:id/progress
                             ▼       ▼         ▼
                ┌────────────┐ ┌─────────────┐ ┌─────────────────┐
                │ auth-svc   │ │ patient-svc │ │ therapy-svc     │
                │ port 4001  │ │ port 4002   │ │ port 4003       │
                │ users/JWT  │ │ patients    │ │ sessions+progress│
                └─────┬──────┘ └──────┬──────┘ └─────────┬───────┘
                      │               │                  │
                      └───────────────┴──────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   PostgreSQL (rehab_db)  │
                        │   Tables: users, patients,│
                        │   sessions, progress_entries│
                        └──────────────────────────┘
```

## Microservice topology

Three independent backend services + one API gateway:

| Service | Port | Owns | Reads from |
|---|---|---|---|
| `auth-service` | 4001 | `users` | — |
| `patient-service` | 4002 | `patients` | `users` (via FK only) |
| `therapy-service` | 4003 | `sessions`, `progress_entries` | `patients`, `users` (via FK only) |
| `api-gateway` | 4000 | nothing | proxies to all three |

**Shared-nothing principle** — no service imports code from another. Each ships its own copy of:
- `db.js` (pg pool wrapper)
- `middleware/authMiddleware.js` (JWT verifier)

The auth middleware copies are functionally identical and trust the same `JWT_SECRET`. In a production system this would be extracted into a shared npm package; for the academic scope, duplication keeps the project simple to read.

**Shared database, separate ownership** — all four tables live in one Postgres database (`rehab_db`), but each service is the only one that writes to its own tables. Cross-service references happen at the FK level, never via cross-service HTTP calls. This avoids the hardest microservice problem (distributed transactions) while keeping service code modular.

## Authentication flow

```
1. Browser → POST /api/auth/login → Gateway → auth-service
2. auth-service: verify password (bcrypt.compare) → sign JWT
       claims: { sub: user_id, email, role, iat, exp }
3. Frontend stores token in localStorage
4. Every subsequent request: axios interceptor adds  Authorization: Bearer <token>
5. Gateway: transparent proxy — does NOT verify the token
6. Downstream service: requireAuth middleware verifies JWT with shared JWT_SECRET
       attaches  req.user = { id, email, role }
7. requireRole('admin') middleware (e.g. patient DELETE) checks req.user.role
```

The gateway is deliberately dumb. Verification at the leaf service means each service can be deployed independently and tested directly without going through the gateway.

## Frontend component hierarchy

```
<BrowserRouter>
 └─ <AuthProvider>                               (token + user state, login/signup/logout)
     └─ <App>
         ├─ <Navbar>                              (active link highlight, logout)
         └─ <Routes>
             ├─ /login        → <Login>
             ├─ /signup       → <Signup>
             ├─ /dashboard    → <ProtectedRoute><Dashboard/></ProtectedRoute>
             ├─ /patients     → <ProtectedRoute><Patients/></ProtectedRoute>
             │                    └─ <PatientForm>      (create)
             ├─ /patients/:id → <ProtectedRoute><PatientDetail/></ProtectedRoute>
             │                    ├─ <PatientForm>      (edit)
             │                    ├─ <PatientSessions>
             │                    │   ├─ <SessionForm>  (lockPatient=true)
             │                    │   └─ <SessionList>  (hidePatient=true)
             │                    └─ <ProgressTimeline>
             │                        └─ <TrendChart>   (inline SVG)
             ├─ /sessions     → <ProtectedRoute><Sessions/></ProtectedRoute>
             │                    ├─ <SessionForm>
             │                    └─ <SessionList>
             ├─ /sessions/:id → <ProtectedRoute><SessionDetail/></ProtectedRoute>
             │                    ├─ <SessionForm>      (reschedule/edit)
             │                    └─ <SessionProgress>  (only when status=completed)
             │                        └─ <ProgressForm>
             └─ *             → <NotFound>
```

### Reusable building blocks

- `<PatientForm>` — used for both create and edit (fields + validation)
- `<SessionForm>` — used in three places: top-level scheduling, reschedule on detail page, inline schedule on patient page (with `lockPatient` to hide the patient picker)
- `<SessionList>` — used on the Sessions page, the Dashboard, and inline on PatientDetail (with `hidePatient` when context already implies it)
- `<ProgressForm>` — used for both record-progress and edit-progress
- `<ScoreBar>` (private to SessionProgress) — visual bar for pain / mobility scores
- `<TrendChart>` (private to ProgressTimeline) — minimal inline SVG chart, no external charting lib

### Cross-cutting concerns

- **`src/api/client.js`** — the single Axios instance. One request interceptor attaches the JWT, one response interceptor handles 401 (clears storage + hard-redirects to /login, with a guard to avoid loops on /login itself).
- **`src/auth/AuthContext.jsx`** — the only place that touches `localStorage` for the token; the rest of the app uses `useAuth()`.
- **`src/auth/ProtectedRoute.jsx`** — guards every authenticated route. Captures the originally-requested location so post-login can redirect back.
- **`src/utils/format.js`** — date formatting helpers shared by SessionList, SessionDetail, ProgressTimeline.

## Key data flows

### Schedule a therapy session (with overlap rejection)

```
User clicks "+ Schedule session"
  → SessionForm fetches GET /api/patients?status=active to populate dropdown
User submits the form
  → POST /api/sessions  → gateway → therapy-service
  → therapy-service:
       1. validate fields (duration 1-480, valid timestamp, etc.)
       2. findOverlap(therapist_id, start, end) — single SQL using interval overlap
       3. if overlap exists → 409 { error, conflicting_session_id }
       4. else INSERT
  → SessionForm catches 409 → shows "Therapist already has session #N at that time"
```

### Patient progress timeline (cross-service join)

```
User opens /patients/:id
  → PatientDetail fetches:
       GET /api/patients/:id        → patient-service  (patient record)
       GET /api/sessions?patientId=:id → therapy-service (session list)
       GET /api/patients/:id/progress  → therapy-service (timeline)
                                         JOIN sessions ⨯ progress_entries
                                         WHERE patient_id = :id
                                         ORDER BY scheduled_at ASC
  → ProgressTimeline renders <TrendChart> + chronological list
```

The timeline endpoint deliberately lives on therapy-service (not patient-service) because it returns therapy data — the URL `/patients/:id/progress` reads naturally for the client, but the gateway routes it to therapy-service via a more-specific path filter that fires before the general `/api/patients/*` rule.
