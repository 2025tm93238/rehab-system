import bcrypt from 'bcryptjs';
import pool from '../db.js';

const ALLOWED_ROLES = ['admin', 'therapist'];

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: 'name, email, password, and role are required' });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res
        .status(400)
        .json({ error: 'password must be at least 6 characters' });
    }

    const emailNormalized = String(email).toLowerCase().trim();

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [emailNormalized]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), emailNormalized, passwordHash, role]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
