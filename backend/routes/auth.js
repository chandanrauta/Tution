const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function makeToken(institute) {
  return jwt.sign(
    { instituteId: institute.id, email: institute.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { institute_name, email, password, phone = '', upi_id = '' } = req.body;
    if (!institute_name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: 'Institute name, email, and 6+ char password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.execute({ sql: 'SELECT id FROM institutes WHERE email = ?', args: [cleanEmail] });
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO institutes (institute_name, email, password_hash, phone, upi_id) VALUES (?, ?, ?, ?, ?)',
      args: [institute_name.trim(), cleanEmail, hash, phone.trim(), upi_id.trim()],
    });

    const newId = Number(result.lastInsertRowid);
    const userRes = await db.execute({
      sql: 'SELECT id, institute_name, email, phone, upi_id, logo_url FROM institutes WHERE id = ?',
      args: [newId],
    });
    const institute = userRes.rows[0];
    res.status(201).json({ token: makeToken(institute), institute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM institutes WHERE email = ?',
      args: [email.trim().toLowerCase()],
    });
    const institute = result.rows[0];
    if (!institute || !(await bcrypt.compare(password, institute.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeInstitute = {
      id: institute.id,
      institute_name: institute.institute_name,
      email: institute.email,
      phone: institute.phone,
      upi_id: institute.upi_id,
      logo_url: institute.logo_url,
    };
    res.json({ token: makeToken(safeInstitute), institute: safeInstitute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT id, institute_name, email, phone, upi_id, logo_url FROM institutes WHERE id = ?',
    args: [req.instituteId],
  });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Institute not found' });
  res.json(result.rows[0]);
});

module.exports = router;