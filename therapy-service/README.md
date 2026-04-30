# Therapy Service

Manages therapy sessions and per-session progress tracking. Progress is stored alongside session outcomes since every progress entry belongs to a completed session.

- Port: `4003`
- Endpoints (all require `Authorization: Bearer <token>`):
  - `GET    /health` — service health probe

  ### Sessions
  - `POST   /sessions` — schedule a new therapy session for a patient (rejects overlapping bookings for the same therapist)
  - `GET    /sessions` — list sessions; supports `?patientId=`, `?therapistId=`, `?status=`
  - `GET    /sessions/:id` — retrieve a single session
  - `PUT    /sessions/:id` — update status, notes, or reschedule (overlap is re-checked on time changes)

  ### Progress per session (one entry per session)
  - `POST   /sessions/:id/progress` — record progress for a **completed** session
  - `GET    /sessions/:id/progress` — fetch the progress entry for a session
  - `PUT    /sessions/:id/progress` — update an existing progress entry

  ### Patient progress timeline
  - `GET    /patients/:patientId/progress` — chronological progress entries across all the patient's completed sessions (joined view)

## Database setup (one-time)

The auth-service `users` table and patient-service `patients` table must already exist (sessions has FKs to both). The schema also defines `progress_entries` (FK to `sessions`).

```bash
psql -h localhost -U postgres -d rehab_db -f therapy-service/db/schema.sql
```

## Local setup

```bash
cd therapy-service
npm install
cp .env.example .env       # then edit .env — JWT_SECRET MUST match auth-service's
npm start
```

The service starts on `http://localhost:4003`.

## Try the endpoints

```bash
TOKEN=$(curl -s -X POST http://localhost:4001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@clinic.test","password":"secret123"}' | jq -r .token)

# Schedule a session
curl -X POST http://localhost:4003/sessions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patient_id":1,"therapist_id":1,"scheduled_at":"2026-05-02T10:00:00Z","duration_minutes":45,"session_type":"physiotherapy"}'

# Mark it completed
curl -X PUT http://localhost:4003/sessions/1 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"completed","notes":"Patient performed 3 sets of knee flexion."}'

# Record progress
curl -X POST http://localhost:4003/sessions/1/progress \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pain_level":4,"mobility_score":6,"summary":"Reduced pain since last session, improved knee flexion range."}'

# Patient timeline (chronological, all completed sessions with progress)
curl http://localhost:4003/patients/1/progress -H "Authorization: Bearer $TOKEN"
```

## Auth model

This service does NOT issue tokens. It verifies JWTs issued by `auth-service` using the shared `JWT_SECRET`.
