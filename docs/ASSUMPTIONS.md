# Assumptions and design decisions

This document captures non-obvious decisions made during development. Each one names the assumption, the alternatives that were considered, and the reason for the chosen path.

## Domain assumptions

**Two roles, no patient login.** The system has `admin` and `therapist`. Patients are records managed by clinic staff — they don't log in themselves. This matches typical rehab clinic workflows where the clinician owns the patient timeline. Adding patient self-service would require a third role and a different consent model; out of scope.

**One progress entry per session.** Real rehab clinics typically write one progress note per session (start of session vs end of session is captured in the same note as a delta). Multiple entries per session would complicate the timeline view and isn't needed for the recovery-arc display. The schema enforces `UNIQUE(session_id)` to make this constraint explicit at the DB layer rather than just in the application.

**Cancelled sessions free their time slot; completed sessions still block.** A therapist who completed a session at 10:00–10:45 was demonstrably unavailable then — a new session can't claim that retroactively. But cancellations mean the slot was never actually used and is fair game.

**Session type is free-text.** Different clinics offer different categories (physiotherapy, occupational, speech, cognitive, group, …). An ENUM would force a global vocabulary; the SessionForm UI offers common types as suggestions but stores the string as-is.

**No appointment conflicts on the patient side.** The overlap check is therapist-scoped only — a patient could in theory have two sessions at the same time with different therapists. In practice this is rare (and could be a deliberate "double-booking" for combined therapy). Easy to extend with another overlap query later if needed.

## Architecture assumptions

**Microservices share a single Postgres database, not separate databases.** Each service owns its tables and only reads from foreign tables via FK references — but the database instance is shared. Pure microservice purists would have one DB per service; that pattern requires distributed-transaction handling that's out of scope here. The shared-DB / separate-tables pattern is the pragmatic mid-point used by most real teams.

**No service-to-service HTTP calls.** Patient names are not embedded into session API responses; the frontend fetches both and joins client-side (see `SessionDetail.jsx`). This avoids a chain of in-band failures and keeps each service's concerns small. Trade-off: the frontend issues two requests on session detail. Acceptable.

**API gateway is a transparent proxy.** It does not verify JWTs. Every microservice runs its own auth middleware. This means each service can be deployed and tested independently without going through the gateway. The downside (token validation cost is paid per service) is fine at this scale.

**Auth middleware is duplicated across services rather than shared via npm package.** Reading the project should not require jumping between repositories. In a production system this would be `@rehab/auth-middleware` published privately; here it's three identical copies of ~30 lines.

## Implementation choices

**bcryptjs over bcrypt.** bcrypt requires native compilation and frequently breaks across platforms. bcryptjs is pure JS, slightly slower, but never has install issues — appropriate for an academic project that may be cloned on different machines.

**ESM modules everywhere.** Modern Node 22 supports ESM natively. Eliminates `require`/`import` interop friction.

**No frontend testing harness.** Playwright/Vitest were considered but skipped — the assignment evaluates "Frontend UI (navigation, interactivity)" by demo, not by automated tests. Backend behaviour is verified via curl + API tests run during each phase commit.

**No charting library.** The progress trend chart is a hand-rolled inline SVG (~30 lines). Brings zero dependencies vs adding `recharts`/`chart.js` (50–100 KB gzipped). For a two-line chart with four data points, plain SVG is the right tool.

**Page titles via React Router but no `<Helmet>`.** A library would add ~20 KB for two pages of dynamic title; not worth it.

## Security choices

**Same generic 401 message** for unknown-email and wrong-password on login. Doesn't leak whether an email exists. Confirmed this hardening choice in the AI usage log so it doesn't get "fixed" by someone who wants more specific messages.

**Mass-assignment protected** on PUT endpoints. Only whitelisted fields are accepted; a client trying to set `id`, `created_at`, or `password_hash` via a patient/session PUT gets silently ignored.

**Passwords never returned.** The `users` SELECT in `register` and `login` returns `password_hash`, but every controller method explicitly omits it from the JSON response (`SELECT id, name, email, role, created_at` — note the missing `password_hash`).

**JWT secret in `.env`.** Both `.env.example` (committed) and `.env` (gitignored) exist. The example file ships placeholder values; real values stay local.

**Foreign-key violations mapped to 400.** When the client supplies an `assigned_therapist_id` or `patient_id` that doesn't exist, Postgres raises `23503` and the controller catches it and returns a friendly 400 — better UX than a generic 500.

## Out of scope (explicitly)

These would be needed for production but are deliberately not included:

- Rate limiting / brute-force protection on login
- HTTPS / TLS certificates (assumed handled by a load balancer in production)
- Refresh tokens (current JWT is 1-day, user simply re-logs in)
- Audit logging (who changed what, when)
- Soft delete (currently `DELETE patient` is hard-delete; sessions cascade)
- Therapist availability windows (currently a therapist can be scheduled 24/7)
- Email/SMS notifications
- File uploads (e.g. attaching X-rays to a session)
- A `/users` endpoint to populate a therapist picker (frontend currently uses a number input — deliberate to keep auth-service narrow)
