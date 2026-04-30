import pool from '../db.js';

const ALLOWED_STATUSES = ['scheduled', 'completed', 'cancelled'];

// Returns the existing session that overlaps the given window for the
// given therapist, or null if the slot is free. Cancelled sessions are
// ignored (their slot is freed). The optional excludeId lets us skip
// the session being updated when checking for overlaps on edit.
async function findOverlap(therapistId, newStart, newEnd, excludeId = null) {
  const params = [therapistId, newStart, newEnd];
  let exclusion = '';
  if (excludeId) {
    params.push(excludeId);
    exclusion = `AND id <> $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT id, scheduled_at, duration_minutes
       FROM sessions
      WHERE therapist_id = $1
        AND status <> 'cancelled'
        AND scheduled_at < $3
        AND (scheduled_at + (duration_minutes || ' minutes')::interval) > $2
        ${exclusion}
      LIMIT 1`,
    params
  );
  return rows[0] || null;
}

export async function createSession(req, res) {
  try {
    const {
      patient_id,
      therapist_id,
      scheduled_at,
      duration_minutes,
      session_type,
      notes,
    } = req.body || {};

    if (!patient_id || !therapist_id || !scheduled_at || !duration_minutes || !session_type) {
      return res.status(400).json({
        error: 'patient_id, therapist_id, scheduled_at, duration_minutes, and session_type are required',
      });
    }

    if (!Number.isInteger(duration_minutes) || duration_minutes <= 0 || duration_minutes > 480) {
      return res.status(400).json({ error: 'duration_minutes must be an integer between 1 and 480' });
    }

    const newStart = new Date(scheduled_at);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: 'scheduled_at must be a valid ISO 8601 timestamp' });
    }
    const newEnd = new Date(newStart.getTime() + duration_minutes * 60_000);

    const conflict = await findOverlap(therapist_id, newStart, newEnd);
    if (conflict) {
      return res.status(409).json({
        error: 'therapist already has a session that overlaps this time slot',
        conflicting_session_id: conflict.id,
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO sessions
         (patient_id, therapist_id, scheduled_at, duration_minutes, session_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patient_id, therapist_id, newStart, duration_minutes, session_type, notes || null]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'patient_id or therapist_id does not refer to an existing record',
      });
    }
    console.error('createSession error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function listSessions(req, res) {
  try {
    const { patientId, therapistId, status } = req.query;

    const conditions = [];
    const params = [];

    if (patientId) {
      params.push(Number(patientId));
      conditions.push(`patient_id = $${params.length}`);
    }
    if (therapistId) {
      params.push(Number(therapistId));
      conditions.push(`therapist_id = $${params.length}`);
    }
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
      }
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT * FROM sessions ${where} ORDER BY scheduled_at DESC`,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error('listSessions error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function getSession(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'session not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('getSession error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function updateSession(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    const { status, notes, scheduled_at, duration_minutes } = req.body || {};

    const { rows: existingRows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'session not found' });
    }
    const existing = existingRows[0];

    const updates = [];
    const params = [];

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (notes !== undefined) {
      params.push(notes);
      updates.push(`notes = $${params.length}`);
    }

    let nextStart = existing.scheduled_at;
    let nextDuration = existing.duration_minutes;
    let timeChanged = false;

    if (scheduled_at !== undefined) {
      const parsed = new Date(scheduled_at);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'scheduled_at must be a valid ISO 8601 timestamp' });
      }
      nextStart = parsed;
      timeChanged = true;
      params.push(parsed);
      updates.push(`scheduled_at = $${params.length}`);
    }

    if (duration_minutes !== undefined) {
      if (!Number.isInteger(duration_minutes) || duration_minutes <= 0 || duration_minutes > 480) {
        return res.status(400).json({ error: 'duration_minutes must be an integer between 1 and 480' });
      }
      nextDuration = duration_minutes;
      timeChanged = true;
      params.push(duration_minutes);
      updates.push(`duration_minutes = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'no updatable fields supplied' });
    }

    if (timeChanged) {
      const newEnd = new Date(new Date(nextStart).getTime() + nextDuration * 60_000);
      const conflict = await findOverlap(existing.therapist_id, nextStart, newEnd, id);
      if (conflict) {
        return res.status(409).json({
          error: 'therapist already has a session that overlaps this time slot',
          conflicting_session_id: conflict.id,
        });
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error('updateSession error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
