import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const emailNormalized = String(email).toLowerCase().trim();

    const result = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [emailNormalized]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const user = result.rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
