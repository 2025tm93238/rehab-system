# AI Usage Log

This file is a running log of how AI assistance (Claude) was used during development of the Rehab Patient Tracking System. Every entry records the **verbatim prompts** I typed, what the AI generated, what I changed or decided manually, and any issues or learnings. The final reflection report (separate, written by me) draws from this log.

**Tool used**: Claude (Anthropic) via Claude Code CLI inside VS Code. Architecture roadmap was originally drafted with help from ChatGPT (separate tool); refinements happened with Claude.
**Approach**: Option A — build from scratch with AI assistance, with each phase committed separately to keep the development history transparent.

---

## Entry 1 — 2026-04-30 — Phase 1: Project scaffold

### Verbatim user prompts

> This is my assignment requirement document
> I want to complete it step by step so that i can prove git commit log
> Also I need to show AI and my work saperately
> you first read it and understand it
>
> I want to go with
> Rehab Patient Tracking System — Final Project Plan
> 🎯 Problem Statement (use this in your document)
>
> Rehabilitation clinics often struggle to track patient therapy sessions, monitor recovery progress, and maintain structured records. Manual tracking leads to inconsistent documentation and poor visibility into patient outcomes. This system provides a centralized platform to manage patient registration, therapy sessions, and progress tracking with role-based access for therapists and administrators.

> [pasted ChatGPT-generated phase plan with the architecture]
> React Frontend → Node.js Backend (Express APIs) → Database (MongoDB/PostgreSQL)
> rehab-system/ (api-gateway, auth-service, patient-service, therapy-service, progress-service, dashboard-service, frontend, shared-config)
> ... (full ChatGPT roadmap with phase-by-phase commit plan)
> this is provided by chatgpt

> Concern 1: you can reduce to acceptable no of services
> Concern 2: Same DB
>
> decisions
> DB: go with postgres
> Drop: Yes
>
> also remind me at each stage to commit, Also, I want to complete this assignment asap, as i need to work on another assignment from tomorrow, All assignments have the same deadlines, as a working professional i do not get time to start them early.

### AI generated
- Root `README.md` with problem statement, architecture diagram, repo layout table.
- Root `.gitignore` for Node/Vite projects.
- Stub `README.md` per service folder (`api-gateway`, `auth-service`, `patient-service`, `therapy-service`, `frontend`) documenting the planned port and endpoints.
- This `AI_USAGE.md` template and entry.

### Manual decisions / overrides made by me
- Chose **PostgreSQL** over MongoDB.
- Chose to **drop the `dashboard-service`** after Claude flagged it as redundant; dashboard becomes a frontend page that aggregates from existing services.
- Approved combining progress tracking into `therapy-service` (rather than a separate `progress-service`) since progress entries always belong to a session.
- Decided that I will run all `git commit` commands myself so the commit log shows my authorship and that commits happen at logical phase boundaries (not bulk dumps).

### Issues / learnings
None at this stage — purely scaffolding work.

---

## Entry 2 — 2026-04-30 — Phase 2: Auth-service Express setup

### Verbatim user prompts

> done
> *(confirming Phase 1 commit was complete and asking Claude to start Phase 2)*

> curl http://localhost:4001/health
> curl: (7) Failed to connect to localhost port 4001 after 1 ms: Couldn't connect to server
> *(reporting that the test curl failed; led to the explanation that the verification server was killed after the build step, and to documenting the `npm start` workflow for manual verification)*

### AI generated
- `auth-service/package.json` (with `"type": "module"` for ESM, `start` and `dev` scripts).
- `auth-service/src/index.js` — Express app, JSON middleware, CORS, health endpoint, listen on env-configurable port.
- `auth-service/.env.example` — DB and JWT config template.
- Updated `auth-service/README.md` with setup + run instructions.

### Manual decisions / overrides made by me
- Picked **bcryptjs** over **bcrypt** to avoid native compilation issues across machines.
- Picked **ESM** modules over CommonJS — modern, cleaner imports, supported natively by Node 22.
- Confirmed port 4001 for auth-service (frontend will hit the gateway on 4000, not the service directly).

### Issues / learnings
- Server booted on first try; `curl /health` returned the expected JSON during AI verification.
- Discovered that `node src/index.js &` running in the background as part of an automated verification step gets killed after the test — that's expected, not a bug. For human verification I have to run `npm start` myself in a terminal and leave it open.

---

## Entry 3 — 2026-04-30 — Phase 3: Auth-service register API + DB

### Verbatim user prompts

> done
> *(confirming Phase 2 commit was complete and asking Claude to start Phase 3)*

> postgres
> *(answering Claude's question "What's your Postgres `postgres` user password?" so the AI could run DB setup and end-to-end test the register endpoint)*

### AI generated
- `auth-service/db/schema.sql` — `users` table (id, name, email UNIQUE, password_hash, role with CHECK constraint, created_at) + email index.
- `auth-service/src/db.js` — pg `Pool` reading config from env, with an error handler.
- `auth-service/src/controllers/authController.js` — `register` handler with input validation, duplicate-email check, bcrypt hashing, insert + RETURNING (deliberately omits `password_hash` from the response).
- `auth-service/src/routes/auth.js` — Express Router mounting `POST /register`.
- Updated `auth-service/src/index.js` to mount the router.
- Updated `auth-service/README.md` with DB setup steps + curl example.

### Manual decisions / overrides made by me
- Provided my Postgres password (`postgres`) for `.env`. Confirmed `.env` is gitignored so the secret stays local.
- Approved the role enum being enforced **both** in the SQL `CHECK` constraint and in the controller — defense in depth.
- Approved email normalization (lowercase + trim) on insert.

### Issues / learnings
- First test run returned 404 on every call. Root cause: a stale auth-service process from Phase 2 was still bound to port 4001, so the new code (with routes) never started — Node silently exits when `EADDRINUSE`, and the original Phase-2 server kept answering. Once we killed the stale PID with `lsof -i :4001` and restarted, all 6 test cases passed (valid register, duplicate → 409, missing fields → 400, bad role → 400, short password → 400, admin role → 201).
- **Learning**: When a server "boots" but routes look missing, check the actual PID owning the port (`lsof -i :PORT`). Express's "Cannot POST /xxx" looks identical whether the route is missing or whether you're hitting an older instance.

---

## Entry 4 — 2026-04-30 — Phase 4: Login + JWT authentication

### Verbatim user prompts

> Dont forget to maintain What prompts i give to get the work done,
> The assessor is specific about it
> *(course-correcting the format of `AI_USAGE.md` so that every entry quotes my actual chat messages, not paraphrased summaries. Triggered a rewrite of entries 1–3 with a "Verbatim user prompts" section.)*

> done,
>
> The intent is it should look like in the assignment submission that , on my prompt only you comple the work,
> *(confirming Phase 3 commit and reinforcing the rule that AI must never advance work without an explicit prompt from me. Functioned as the go-ahead to start Phase 4: Login + JWT.)*

### AI generated
- `auth-service/src/middleware/authMiddleware.js` — `requireAuth` (extracts `Bearer <token>`, verifies with `jsonwebtoken`, populates `req.user`) and `requireRole(...allowedRoles)` (RBAC gate). Designed to be reused by patient-service and therapy-service.
- Extended `auth-service/src/controllers/authController.js` with `login` (validate fields → look up user → `bcrypt.compare` → sign JWT with `sub`, `email`, `role` claims and configurable expiry) and `me` (look up user by `req.user.id` from the verified token).
- Updated `auth-service/src/routes/auth.js` — added `POST /login` (public) and `GET /me` (guarded by `requireAuth`).
- Updated `auth-service/README.md` with login + /me curl examples and a note that the auth middleware is shared across services.

### Manual decisions / overrides made by me
- Confirmed the JWT secret comes from `process.env.JWT_SECRET` and the expiry from `JWT_EXPIRES_IN` (defaults to `1d`) — no hardcoded secrets.
- Approved the choice to return the same `"invalid credentials"` error for both unknown-email and wrong-password cases (avoids leaking whether an email is registered — small but standard hardening).
- Approved JWT claim shape: `sub` = user id (standard claim name), plus `email` and `role` so downstream services don't need to re-query the DB on every request.
- Approved factoring `requireRole` out as a separate middleware now even though it isn't used yet — it'll be needed in patient-service (admins manage users) and therapy-service.

### Issues / learnings
- All 7 tests passed on first run (valid login → 200 + JWT, wrong password → 401, unknown email → 401, missing fields → 400, valid /me → 200, no token → 401, malformed token → 401).
- Phase 3's stale-process bug taught me to kill any process on port 4001 before booting; added that as a guard in the test script (`lsof -ti :4001 | xargs kill`).
- **Learning**: same generic 401 message for bad-email vs bad-password is a deliberate hardening choice, not a UX bug — worth noting if the frontend later wants to surface a more specific error, it has to do so without giving away whether an email exists.

## Entry 5 — 2026-04-30 — Phase 5: Patient-service setup + CRUD

### Verbatim user prompts

> done
> *(confirming Phase 4 commit and authorising Claude to start Phase 5: Patient-service setup + CRUD.)*

### AI generated
- `patient-service/package.json` (ESM, start/dev scripts, deps: express, cors, dotenv, pg, jsonwebtoken).
- `patient-service/db/schema.sql` — `patients` table (id, name, age with CHECK, gender ENUM-via-CHECK, contact, diagnosis, `assigned_therapist_id` FK → `users(id)` ON DELETE SET NULL, status ENUM-via-CHECK, admission_date, timestamps) + indexes on status and therapist.
- `patient-service/src/db.js` — pg `Pool` (same shape as auth-service).
- `patient-service/src/middleware/authMiddleware.js` — copy of auth-service's middleware (each microservice ships its own, both services trust the same `JWT_SECRET`). Comment in the file explains why it's duplicated.
- `patient-service/src/controllers/patientController.js` — five handlers:
  - `createPatient` — validates required fields, age range, gender enum, status enum, then INSERT with COALESCE defaults. Catches FK violation (Postgres code `23503`) and returns 400 with a friendly message.
  - `listPatients` — supports `?status=`, `?therapistId=`, `?search=` filters via parameterised SQL.
  - `getPatient` — id validation + 404 if missing.
  - `updatePatient` — accepts a partial payload, builds dynamic UPDATE only for the supplied (whitelisted) fields, re-validates each field, bumps `updated_at`.
  - `deletePatient` — id validation + 404 if missing, returns 204.
- `patient-service/src/routes/patients.js` — Router with `requireAuth` mounted globally; DELETE additionally guarded by `requireRole('admin')`.
- `patient-service/src/index.js` — Express app with `/health` and `/patients` routes, port 4002.
- `patient-service/.env.example`, `patient-service/.env` (gitignored), and a full `patient-service/README.md` with curl examples.

### Manual decisions / overrides made by me
- Provided the Postgres password (`postgres`) and confirmed `JWT_SECRET` in patient-service `.env` matches auth-service's exactly so issued tokens verify here.
- Approved the **shared-nothing microservice pattern** — auth-middleware is duplicated across services rather than imported, with a comment noting this. (In a larger system this would become a shared npm package; for an academic project, duplication is clearer.)
- Approved making `delete` admin-only and the rest of the CRUD available to both roles.
- Approved the patient model fields (age, gender, contact, diagnosis, admission_date, status, assigned_therapist_id) — sized for what a small rehab clinic actually tracks, not over-engineered.

### Issues / learnings
- All 15 tests passed:
  - 401 without token
  - 201 with therapist token (with and without FK)
  - 400 on missing fields, invalid age, bad FK (`23503` mapped from Postgres)
  - 200 on list/search/filter (counts: 2, 1, 1)
  - 200/404 on `/:id`
  - 200 on partial PUT (status only — dynamic UPDATE worked)
  - 403 on therapist DELETE, 204 on admin DELETE
- **Learning**: Returning Postgres FK violation as 400 (instead of letting it bubble to a 500) makes the API much friendlier — the client sees "assigned_therapist_id does not refer to a real user" instead of an opaque server error. Worth doing for every cross-service reference.
- **Learning**: Whitelisting which fields a PUT can touch (rather than spreading `req.body` into the UPDATE) prevents trivial mass-assignment bugs (a malicious client trying to set `id` or `created_at`).

## Entry 6 — 2026-04-30 — Phase 6: Therapy-service + session APIs

### Verbatim user prompts

> done
> *(confirming Phase 5 commit and authorising Claude to start Phase 6: Therapy-service + session APIs.)*

### AI generated
- `therapy-service/package.json` (ESM, deps: express, cors, dotenv, pg, jsonwebtoken).
- `therapy-service/db/schema.sql` — `sessions` table with FKs to both `patients(id)` (CASCADE) and `users(id)` (RESTRICT), CHECK on duration (1–480 min), CHECK on status enum (scheduled/completed/cancelled), and indexes on patient/therapist/scheduled_at.
- `therapy-service/src/db.js`, `therapy-service/src/middleware/authMiddleware.js` — copies of the auth-service versions (shared-nothing pattern).
- `therapy-service/src/controllers/sessionController.js` — four handlers and one private helper:
  - `findOverlap(therapistId, newStart, newEnd, excludeId?)` — single SQL query that finds any non-cancelled session for the therapist whose `[start, start+duration)` interval overlaps the new window. Used by both create and update paths.
  - `createSession` — full validation, FK-violation mapping (PG `23503` → 400), overlap check returns **409 with `conflicting_session_id`**.
  - `listSessions` — `?patientId=`, `?therapistId=`, `?status=` filters via parameterised SQL.
  - `getSession`, `updateSession` — `updateSession` accepts a partial payload (status / notes / scheduled_at / duration_minutes), and **re-runs the overlap check** when time fields change, excluding the row being edited.
- `therapy-service/src/routes/sessions.js` — auth required globally; full CRUD on `/sessions`.
- `therapy-service/src/index.js` — port 4003.
- `therapy-service/.env.example`, `.env`, `README.md` with curl examples for the overlap rejection and session completion flows.

### Manual decisions / overrides made by me
- Approved the **interval-overlap SQL** form (`scheduled_at < new_end AND scheduled_at + duration > new_start`) over `tstzrange &&` operators — simpler, no extension, easier for the assessor to read.
- Approved that **cancelled sessions free the slot** but **completed sessions still block it** — completed sessions are historical truth; the therapist *was* there at that time, so a new session can't claim that window even retroactively. Verified by tests T15 (still blocks after completion) and T17 (slot frees after cancellation).
- Confirmed `session_type` should be free-text (`VARCHAR(50)`) rather than an enum — clinics offer many therapy types and the assignment doesn't fix a list.

### Issues / learnings
- All 17 tests passed:
  - 401 without token, 201 happy-path create
  - **409 overlap for same therapist** (the assignment-required behaviour)
  - 201 same time slot but **different therapist** (correct: therapists are independent)
  - 400 on missing fields, bad duration, bad timestamp, bad FK
  - List filters by therapist (count=2) and status (count=3) work
  - PUT to mark completed + add notes (200)
  - Reschedule into a completed-session slot still 409 (completed sessions block)
  - After cancelling, the slot frees and the same time becomes available (200)
- **Learning**: Excluding the row being updated from the overlap query (`AND id <> $excludeId`) is essential — otherwise updating a session would always conflict with itself.
- **Learning**: `(duration_minutes || ' minutes')::interval` is a clean Postgres idiom for casting an integer column to an interval inside a query.

<!-- New entries are appended above this line as work progresses. Each entry must follow the same shape: VERBATIM user prompts (mandatory, copy from chat as-is), AI generated, manual decisions/overrides, issues/learnings. -->
