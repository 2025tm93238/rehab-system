import pool from '../db.js';

const ALLOWED_GENDERS = ['male', 'female', 'other'];
const ALLOWED_STATUSES = ['active', 'discharged'];

export async function createPatient(req, res) {
  try {
    const {
      name,
      age,
      gender,
      contact,
      diagnosis,
      assigned_therapist_id,
      status,
      admission_date,
    } = req.body || {};

    if (!name || age === undefined || !gender || !diagnosis) {
      return res.status(400).json({
        error: 'name, age, gender, and diagnosis are required',
      });
    }

    if (!Number.isInteger(age) || age < 0 || age > 150) {
      return res.status(400).json({ error: 'age must be an integer between 0 and 150' });
    }

    if (!ALLOWED_GENDERS.includes(gender)) {
      return res
        .status(400)
        .json({ error: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO patients
         (name, age, gender, contact, diagnosis, assigned_therapist_id, status, admission_date)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'), COALESCE($8, CURRENT_DATE))
       RETURNING *`,
      [
        name.trim(),
        age,
        gender,
        contact || null,
        diagnosis,
        assigned_therapist_id || null,
        status || null,
        admission_date || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'assigned_therapist_id does not refer to a real user' });
    }
    console.error('createPatient error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function listPatients(req, res) {
  try {
    const { status, therapistId, search } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (therapistId) {
      params.push(Number(therapistId));
      conditions.push(`assigned_therapist_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(name) LIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM patients ${where} ORDER BY id DESC`,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('listPatients error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function getPatient(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid patient id' });
    }

    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'patient not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getPatient error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function updatePatient(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid patient id' });
    }

    const allowedFields = [
      'name',
      'age',
      'gender',
      'contact',
      'diagnosis',
      'assigned_therapist_id',
      'status',
      'admission_date',
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];

        if (field === 'gender' && value !== null && !ALLOWED_GENDERS.includes(value)) {
          return res.status(400).json({ error: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` });
        }
        if (field === 'status' && value !== null && !ALLOWED_STATUSES.includes(value)) {
          return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
        }
        if (field === 'age' && (!Number.isInteger(value) || value < 0 || value > 150)) {
          return res.status(400).json({ error: 'age must be an integer between 0 and 150' });
        }

        params.push(value);
        updates.push(`${field} = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'no updatable fields supplied' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'patient not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'assigned_therapist_id does not refer to a real user' });
    }
    console.error('updatePatient error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function deletePatient(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid patient id' });
    }

    const result = await pool.query(
      'DELETE FROM patients WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'patient not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deletePatient error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
