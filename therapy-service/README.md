# Therapy Service

Manages therapy sessions and per-session progress tracking. Progress is stored as part of session outcomes, since every progress entry belongs to a completed session.

- Port: `4003`
- Endpoints (planned):
  - `POST /sessions` — schedule a new therapy session for a patient
  - `GET /sessions` — list sessions (filter by patient or therapist)
  - `GET /sessions/:id` — retrieve a session
  - `PUT /sessions/:id` — update session status (scheduled / completed / cancelled)
  - `POST /sessions/:id/progress` — record progress for a completed session
  - `GET /patients/:patientId/progress` — retrieve full progress history for a patient

Implementation pending.
