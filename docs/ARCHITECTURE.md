# Architecture — Rehab Patient Tracking System

---

## Overview

This system follows a **microservices-based architecture** with a React frontend, an API Gateway, and independent backend services for authentication, patient management, and therapy tracking, all backed by a shared PostgreSQL database.

---

## Tech Stack

* **Frontend:** React + Vite
* **Backend:** Node.js (Express)
* **Database:** PostgreSQL
* **Authentication:** JWT
* **Communication:** REST APIs via API Gateway

---

## System Diagram

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
                        │   path-based routing     │
                        └────┬───────┬─────────┬───┘
              /api/auth/*    │       │         │   /api/sessions/*
                             │       │         │   /api/patients/:id/progress
                             ▼       ▼         ▼
                ┌────────────┐ ┌─────────────┐ ┌─────────────────┐
                │ auth-service │ │ patient-service │ │ therapy-service │
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

---

## Microservice Topology

Three independent backend services + one API gateway:

| Service           | Port | Owns                           | Reads from                        |
| ----------------- | ---- | ------------------------------ | --------------------------------- |
| `auth-service`    | 4001 | `users`                        | —                                 |
| `patient-service` | 4002 | `patients`                     | `users` (via FK only)             |
| `therapy-service` | 4003 | `sessions`, `progress_entries` | `patients`, `users` (via FK only) |
| `api-gateway`     | 4000 | —                              | proxies to all services           |

---

## Services Summary

* **auth-service** → user authentication & JWT
* **patient-service** → patient records management
* **therapy-service** → sessions and progress tracking
* **api-gateway** → request routing layer

---

## Key Design Decisions

* API Gateway is intentionally lightweight (no authentication logic)
* Each service independently validates JWT tokens
* Shared database is used to avoid distributed transaction complexity
* No inter-service HTTP calls (simplifies architecture and debugging)

---

## Architecture Principles

### Shared-Nothing Principle

No service imports code from another. Each service maintains its own:

* `db.js` (database connection)
* `authMiddleware.js` (JWT verification)

In production, these would be shared via a package. For this assignment, duplication improves clarity and independence.

---

### Shared Database, Separate Ownership

All tables reside in a single PostgreSQL database (`rehab_db`), but:

* Each service writes only to its own tables
* Cross-service relationships exist only via foreign keys
* No service directly calls another service

This avoids distributed transactions while maintaining modular design.

---

## Authentication Flow

```
1. Browser → POST /api/auth/login → Gateway → auth-service
2. auth-service:
       - verify password (bcrypt.compare)
       - generate JWT
       claims: { sub: user_id, email, role, iat, exp }
3. Frontend stores token in localStorage
4. Axios interceptor attaches Authorization header
5. Gateway forwards request (no validation)
6. Downstream service verifies JWT
       → attaches req.user
7. Role-based middleware enforces access control
```

The API Gateway is deliberately simple. Authentication is handled at the service level, allowing independent deployment and testing.

---

## Frontend Component Hierarchy

```
<BrowserRouter>
 └─ <AuthProvider>
     └─ <App>
         ├─ <Navbar>
         └─ <Routes>
             ├─ /login        → <Login>
             ├─ /signup       → <Signup>
             ├─ /dashboard    → <ProtectedRoute><Dashboard/></ProtectedRoute>
             ├─ /patients     → <ProtectedRoute><Patients/></ProtectedRoute>
             │                    └─ <PatientForm>
             ├─ /patients/:id → <ProtectedRoute><PatientDetail/></ProtectedRoute>
             │                    ├─ <PatientForm>
             │                    ├─ <PatientSessions>
             │                    │   ├─ <SessionForm>
             │                    │   └─ <SessionList>
             │                    └─ <ProgressTimeline>
             │                        └─ <TrendChart>
             ├─ /sessions     → <ProtectedRoute><Sessions/></ProtectedRoute>
             │                    ├─ <SessionForm>
             │                    └─ <SessionList>
             ├─ /sessions/:id → <ProtectedRoute><SessionDetail/></ProtectedRoute>
             │                    ├─ <SessionForm>
             │                    └─ <SessionProgress>
             │                        └─ <ProgressForm>
             └─ *             → <NotFound>
```

---

## Reusable Components

* `<PatientForm>` — create/edit patient
* `<SessionForm>` — create/reschedule session
* `<SessionList>` — reusable across pages
* `<ProgressForm>` — add/edit progress
* `<ScoreBar>` — visual score representation
* `<TrendChart>` — inline SVG chart

---

## Cross-Cutting Concerns

* **API Client (`client.js`)** — handles JWT injection & error handling
* **Auth Context** — manages user state globally
* **ProtectedRoute** — route-level access control
* **Utility functions** — date formatting & helpers

---

## Key Data Flows

### 1. Schedule Therapy Session (with Overlap Prevention)

```
User schedules session
  → POST /api/sessions
  → therapy-service:
       validate input
       check overlap using SQL interval logic
       if conflict → 409 error
       else insert session
  → UI displays conflict message if needed
```

---

### 2. Patient Progress Timeline

```
User opens patient detail page
  → Fetch patient data
  → Fetch sessions
  → Fetch progress timeline
  → therapy-service performs JOIN (sessions + progress_entries)
  → UI renders chronological recovery view
```

The progress endpoint is handled by `therapy-service` since it owns session and progress data, even though the route appears under `/patients`.

---

## Summary

This architecture balances:

* Simplicity (shared DB, no service-to-service calls)
* Modularity (separate services)
* Scalability (clear separation of concerns)

It is intentionally designed to demonstrate **real-world microservices concepts within an academic scope**.
