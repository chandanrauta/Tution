const express = require('express');
const router = express.Router();
const { db } = require('../db');

function normalizeBatch(raw = '') {
  return String(raw).trim().replace(/\s+/g, ' ').replace(/^(\d+)\s+(st|nd|rd|th)$/i, '$1$2');
}

function cleanIndianPhone(raw = '') {
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

router.get('/', async (req, res) => {
  const showAll = req.query.all === 'true';
  const sql = showAll
    ? 'SELECT * FROM students WHERE institute_id = ? ORDER BY name ASC'
    : 'SELECT * FROM students WHERE institute_id = ? AND is_active = 1 ORDER BY name ASC';
  const result = await db.execute({ sql, args: [req.instituteId] });
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, parent_phone = '', batch = '', monthly_fee = 0 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Student name is required' });

  const phone = cleanIndianPhone(parent_phone);
  if (!isValidIndianPhone(phone)) {
    return res.status(400).json({ error: 'Valid 10-digit Indian mobile number (starting with 6-9) is required' });
  }

  const dup = await db.execute({
    sql: 'SELECT id FROM students WHERE institute_id = ? AND LOWER(TRIM(name)) = LOWER(?) AND parent_phone = ?',
    args: [req.instituteId, name.trim(), phone],
  });
  if (dup.rows.length > 0) {
    return res.status(400).json({ error: 'This student with the same phone number already exists.' });
  }

  const cleanBatch = normalizeBatch(batch);
  const result = await db.execute({
    sql: 'INSERT INTO students (institute_id, name, parent_phone, batch, monthly_fee) VALUES (?, ?, ?, ?, ?)',
    args: [req.instituteId, name.trim(), phone, cleanBatch, Number(monthly_fee) || 0],
  });

  const created = await db.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  res.status(201).json(created.rows[0]);
});

router.post('/bulk', async (req, res) => {
  const rows = req.body.students;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No students found in file.' });
  }

  const existingRes = await db.execute({
    sql: 'SELECT LOWER(TRIM(name)) AS n, parent_phone AS p FROM students WHERE institute_id = ?',
    args: [req.instituteId],
  });
  const seen = new Set(existingRes.rows.map((r) => `${r.n}|${r.p}`));

  const statements = [];
  const skipped = [];

  for (const r of rows) {
    const name = String(r.name || '').trim();
    const phone = cleanIndianPhone(r.parent_phone || '');
    const batch = normalizeBatch(r.batch || '');
    const fee = Number(r.monthly_fee) || 0;
    const key = `${name.toLowerCase()}|${phone}`;

    if (!name || !isValidIndianPhone(phone) || seen.has(key)) {
      skipped.push(name || 'Unnamed row');
      continue;
    }

    seen.add(key);
    statements.push({
      sql: 'INSERT INTO students (institute_id, name, parent_phone, batch, monthly_fee) VALUES (?, ?, ?, ?, ?)',
      args: [req.instituteId, name, phone, batch, fee],
    });
  }

  if (statements.length > 0) {
    await db.batch(statements, 'write');
  }

  res.status(201).json({ imported: statements.length, skipped });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, parent_phone = '', batch = '', monthly_fee = 0 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Student name is required' });

  const phone = cleanIndianPhone(parent_phone);
  if (!isValidIndianPhone(phone)) {
    return res.status(400).json({ error: 'Valid 10-digit Indian mobile number (starting with 6-9) is required' });
  }

  const cleanBatch = normalizeBatch(batch);
  const result = await db.execute({
    sql: 'UPDATE students SET name = ?, parent_phone = ?, batch = ?, monthly_fee = ? WHERE id = ? AND institute_id = ?',
    args: [name.trim(), phone, cleanBatch, Number(monthly_fee) || 0, id, req.instituteId],
  });

  if (result.rowsAffected === 0) return res.status(404).json({ error: 'Student not found' });
  const updated = await db.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [id] });
  res.json(updated.rows[0]);
});

router.patch('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  await db.execute({
    sql: 'UPDATE students SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ? AND institute_id = ?',
    args: [id, req.instituteId],
  });
  const updated = await db.execute({ sql: 'SELECT * FROM students WHERE id = ? AND institute_id = ?', args: [id, req.instituteId] });
  if (updated.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
  res.json(updated.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({
    sql: 'DELETE FROM students WHERE id = ? AND institute_id = ?',
    args: [id, req.instituteId],
  });
  if (result.rowsAffected === 0) return res.status(404).json({ error: 'Student not found' });
  res.json({ deleted: true, id: Number(id) });
});

module.exports = router;