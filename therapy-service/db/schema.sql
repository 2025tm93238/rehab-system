-- Therapy service schema
-- Owns: sessions table (progress table will be added in next phase)
-- References:
--   sessions.patient_id   -> patients(id)  (patient-service's table)
--   sessions.therapist_id -> users(id)     (auth-service's table)
-- All three services share the same Postgres database (rehab_db).

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    session_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON sessions(scheduled_at);

-- Progress entries — one per session (UNIQUE on session_id).
-- Recorded by the therapist after a session is marked 'completed'.
CREATE TABLE IF NOT EXISTS progress_entries (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
    mobility_score INTEGER NOT NULL CHECK (mobility_score >= 0 AND mobility_score <= 10),
    summary TEXT NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_session ON progress_entries(session_id);
