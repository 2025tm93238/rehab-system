# Database schema

All four tables live in one PostgreSQL database (`rehab_db`). Each microservice owns and writes to its own tables but they share the database instance.

## ER diagram

```
                ┌─────────────────────────┐
                │         users           │
                │  (owned by auth-service)│
                ├─────────────────────────┤
                │ id            SERIAL PK │
                │ name          VARCHAR   │
                │ email         UNIQUE    │
                │ password_hash VARCHAR   │
                │ role          ENUM      │  ('admin' | 'therapist')
                │ created_at    TIMESTAMP │
                └────┬───────────────┬────┘
                     │               │
       assigned_     │               │  therapist_id
       therapist_id  │               │
                     ▼               ▼
        ┌─────────────────┐    ┌──────────────────────────┐
        │    patients     │    │        sessions          │
        │ (patient-svc)   │    │      (therapy-svc)       │
        ├─────────────────┤    ├──────────────────────────┤
        │ id        PK    │◄───┤ patient_id      FK       │
        │ name            │    │ therapist_id    FK       │
        │ age   CHECK 0-150│   │ scheduled_at  TIMESTAMP  │
        │ gender   ENUM   │    │ duration_minutes CHECK   │
        │ contact         │    │ session_type             │
        │ diagnosis       │    │ status   ENUM            │  ('scheduled' | 'completed' | 'cancelled')
        │ status   ENUM   │    │ notes                    │
        │ admission_date  │    │ created_at, updated_at   │
        │ created_at, updated_at│└──────────┬───────────────┘
        └─────────────────┘                │  session_id (UNIQUE)
                                           ▼
                                ┌────────────────────────┐
                                │   progress_entries     │
                                │   (therapy-svc)        │
                                ├────────────────────────┤
                                │ id              PK     │
                                │ session_id    FK UNIQ  │
                                │ pain_level   CHECK 0-10│
                                │ mobility_score CHECK 0-10│
                                │ summary       TEXT     │
                                │ recorded_at   TIMESTAMP│
                                └────────────────────────┘
```

## Tables

### `users` (owned by auth-service)

| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL — bcrypt $2b$10$ |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('admin', 'therapist') |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Indexes: `idx_users_email` on `email`.

### `patients` (owned by patient-service)

| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR(100) | NOT NULL |
| `age` | INTEGER | NOT NULL, CHECK age BETWEEN 0 AND 150 |
| `gender` | VARCHAR(20) | NOT NULL, CHECK IN ('male', 'female', 'other') |
| `contact` | VARCHAR(50) | nullable |
| `diagnosis` | TEXT | NOT NULL |
| `assigned_therapist_id` | INTEGER | FK → users(id) ON DELETE SET NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'discharged') |
| `admission_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Indexes: `idx_patients_status`, `idx_patients_therapist`.

**Why `ON DELETE SET NULL`** for `assigned_therapist_id`: deleting a therapist user shouldn't cascade-delete their patients. The patient record stays, just unassigned, until reassigned.

### `sessions` (owned by therapy-service)

| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `patient_id` | INTEGER | NOT NULL, FK → patients(id) ON DELETE CASCADE |
| `therapist_id` | INTEGER | NOT NULL, FK → users(id) ON DELETE RESTRICT |
| `scheduled_at` | TIMESTAMP | NOT NULL |
| `duration_minutes` | INTEGER | NOT NULL, CHECK duration_minutes BETWEEN 1 AND 480 |
| `session_type` | VARCHAR(50) | NOT NULL — free-text (physiotherapy, occupational, speech, …) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'scheduled', CHECK IN ('scheduled', 'completed', 'cancelled') |
| `notes` | TEXT | nullable |
| `created_at`, `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

Indexes: `idx_sessions_patient`, `idx_sessions_therapist`, `idx_sessions_scheduled`.

**Why `CASCADE` on patient delete vs `RESTRICT` on therapist delete:**
- A patient's sessions are owned by them — if the patient record goes (and admins can do that), their sessions go too.
- A therapist who has historical sessions cannot be deleted outright — RESTRICT prevents losing audit trail. The application would need to mark them as inactive instead.

### `progress_entries` (owned by therapy-service)

| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `session_id` | INTEGER | NOT NULL, **UNIQUE**, FK → sessions(id) ON DELETE CASCADE |
| `pain_level` | INTEGER | NOT NULL, CHECK pain_level BETWEEN 0 AND 10 |
| `mobility_score` | INTEGER | NOT NULL, CHECK mobility_score BETWEEN 0 AND 10 |
| `summary` | TEXT | NOT NULL |
| `recorded_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Indexes: `idx_progress_session`.

**Why UNIQUE on `session_id`**: one progress entry per session. Therapists update via PUT, not by adding more rows. The DB-level uniqueness means duplicate POSTs get a clean Postgres `23505` we map to HTTP 409.

## Schema files

Each service owns its DDL:
- `auth-service/db/schema.sql`
- `patient-service/db/schema.sql`
- `therapy-service/db/schema.sql`

Apply in dependency order:
```bash
psql -h localhost -U postgres -c "CREATE DATABASE rehab_db;"
psql -h localhost -U postgres -d rehab_db -f auth-service/db/schema.sql
psql -h localhost -U postgres -d rehab_db -f patient-service/db/schema.sql
psql -h localhost -U postgres -d rehab_db -f therapy-service/db/schema.sql
```
