-- Patient service schema
-- Owns: patients table
-- References: users.id (assigned_therapist_id) — foreign key into auth-service's table.
-- Both services share the same Postgres database (rehab_db); each owns its own tables.

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    contact VARCHAR(50),
    diagnosis TEXT NOT NULL,
    assigned_therapist_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged')),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_therapist ON patients(assigned_therapist_id);
