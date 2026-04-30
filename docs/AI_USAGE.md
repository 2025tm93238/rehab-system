# AI Usage Log

This file is a running log of how AI assistance (Claude) was used during development of the Rehab Patient Tracking System. It records prompts, what AI generated, what was modified or written manually, and any learnings or issues. The final reflection report (separate, written by the student) draws from this log.

**Tool used**: Claude (Anthropic), via Claude Code CLI inside VS Code.
**Approach**: Option A — build from scratch with AI assistance, with each phase committed separately to keep the development history transparent.

---

## Entry 1 — 2026-04-30 — Phase 1: Project scaffold

**Prompt summary**: Asked Claude to set up the initial repository structure for a microservice-based Rehab Patient Tracking System with React frontend, Express services, PostgreSQL DB, and an API gateway. Architecture roadmap was originally drafted with help from ChatGPT (separate tool); Claude pushed back on having a separate `dashboard-service` (redundant with the frontend page) and recommended one shared Postgres instance instead of per-service DBs to avoid distributed-data complexity.

**AI generated**:
- Root `README.md` with problem statement, architecture diagram, repo layout table.
- Root `.gitignore` for Node/Vite projects.
- One stub `README.md` per service folder (`api-gateway`, `auth-service`, `patient-service`, `therapy-service`, `frontend`) documenting the planned port and endpoints.
- This `AI_USAGE.md` template and entry.

**Manual decisions / overrides made by me**:
- Chose PostgreSQL over MongoDB.
- Chose to drop the `dashboard-service` after Claude flagged it as redundant; dashboard becomes a frontend page that aggregates from existing services.
- Chose to combine progress tracking into `therapy-service` (rather than a separate `progress-service`) since progress entries always belong to a session.
- Decided that I will run all `git commit` commands myself so the commit log shows my authorship and that commits happen at logical phase boundaries (not bulk dumps).

**Issues / learnings**: None at this stage — purely scaffolding work.

---

## Entry 2 — 2026-04-30 — Phase 2: Auth-service Express setup

**Prompt summary**: Asked Claude to bootstrap the `auth-service` as a minimal Express server with a `/health` endpoint, and to install all dependencies the auth flow will eventually need (Express, CORS, dotenv, pg, bcryptjs, jsonwebtoken). Goal: get the service booting cleanly so subsequent phases can add register/login on top of a known-good baseline.

**AI generated**:
- `auth-service/package.json` (with `"type": "module"` for ESM, `start` and `dev` scripts).
- `auth-service/src/index.js` — Express app, JSON middleware, CORS, health endpoint, listen on env-configurable port.
- `auth-service/.env.example` — DB and JWT config template.
- Updated `auth-service/README.md` with setup + run instructions.

**Manual decisions / overrides made by me**:
- Picked **bcryptjs** over **bcrypt** to avoid native compilation issues across machines.
- Picked **ESM** modules over CommonJS — modern, cleaner imports, supported natively by Node 22.
- Confirmed port 4001 for auth-service (frontend will hit the gateway on 4000, not the service directly).

**Issues / learnings**: None — server booted on first try, `curl /health` returned the expected JSON.

<!-- New entries are appended above this line as work progresses. Each entry should follow the same shape: prompt summary, AI generated, manual decisions/overrides, issues/learnings. -->
