import pool from '../db.js';

function validatePayload({ pain_level, mobility_score, summary }, { partial = false } = {}) {
  if (!partial) {
    if (pain_level === undefined || mobility_score === undefined || !summary) {
      return 'pain_level, mobility_score, and summary are required';
    }
  }
  if (pain_level !== undefined) {
    if (!Number.isInteger(pain_level) || pain_level < 0 || pain_level > 10) {
      return 'pain_level must be an integer between 0 and 10';
    }
  }
  if (mobility_score !== undefined) {
    if (!Number.isInteger(mobility_score) || mobility_score < 0 || mobility_score > 10) {
      return 'mobility_score must be an integer between 0 and 10';
    }
  }
  if (summary !== undefined && (typeof summary !== 'string' || summary.trim() === '')) {
    return 'summary must be a non-empty string';
  }
  return null;
}

export async function createProgress(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    const { pain_level, mobility_score, summary } = req.body || {};
    const validationError = validatePayload({ pain_level, mobility_score, summary });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { rows: sessionRows } = await pool.query(
      'SELECT id, status FROM sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'session not found' });
    }
    if (sessionRows[0].status !== 'completed') {
      return res.status(400).json({
        error: 'progress can only be recorded for completed sessions',
        session_status: sessionRows[0].status,
      });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO progress_entries (session_id, pain_level, mobility_score, summary)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [sessionId, pain_level, mobility_score, summary.trim()]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({
          error: 'progress entry already exists for this session — use PUT to update',
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('createProgress error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function getProgress(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM progress_entries WHERE session_id = $1',
      [sessionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'no progress entry recorded for this session' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('getProgress error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function updateProgress(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    const { pain_level, mobility_score, summary } = req.body || {};
    const validationError = validatePayload(
      { pain_level, mobility_score, summary },
      { partial: true }
    );
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updates = [];
    const params = [];
    if (pain_level !== undefined) {
      params.push(pain_level);
      updates.push(`pain_level = $${params.length}`);
    }
    if (mobility_score !== undefined) {
      params.push(mobility_score);
      updates.push(`mobility_score = $${params.length}`);
    }
    if (summary !== undefined) {
      params.push(summary.trim());
      updates.push(`summary = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'no updatable fields supplied' });
    }

    params.push(sessionId);
    const { rows } = await pool.query(
      `UPDATE progress_entries
          SET ${updates.join(', ')}
        WHERE session_id = $${params.length}
        RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'no progress entry recorded for this session' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('updateProgress error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function getPatientProgressTimeline(req, res) {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({ error: 'invalid patient id' });
    }

    const { rows } = await pool.query(
      `SELECT
          s.id              AS session_id,
          s.scheduled_at,
          s.session_type,
          s.duration_minutes,
          s.therapist_id,
          p.id              AS progress_id,
          p.pain_level,
          p.mobility_score,
          p.summary,
          p.recorded_at
        FROM sessions s
        JOIN progress_entries p ON p.session_id = s.id
       WHERE s.patient_id = $1
       ORDER BY s.scheduled_at ASC`,
      [patientId]
    );

    return res.json(rows);
  } catch (err) {
    console.error('getPatientProgressTimeline error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
