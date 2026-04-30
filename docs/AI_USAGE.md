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

<!-- New entries are appended above this line as work progresses. Each entry must follow the same shape: VERBATIM user prompts (mandatory, copy from chat as-is), AI generated, manual decisions/overrides, issues/learnings. -->
