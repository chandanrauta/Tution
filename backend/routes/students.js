const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all active students (pass ?all=true to include inactive)
router.get('/', (req, res) => {
  const showAll = req.query.all === 'true';
  const rows = showAll
    ? db.prepare('SELECT * FROM students ORDER BY name ASC').all()
    : db.prepare('SELECT * FROM students WHERE is_active = 1 ORDER BY name ASC').all();
  res.json(rows);
});

// POST register a new student
router.post('/', (req, res) => {
  const { name, parent_phone = '', batch = '', monthly_fee = 0 } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Student name is required' });
  }

  const stmt = db.prepare(
    'INSERT INTO students (name, parent_phone, batch, monthly_fee) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name.trim(), parent_phone.trim(), batch.trim(), Number(monthly_fee) || 0);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(student);
});

// PATCH toggle active/inactive status
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE students SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!updated) return res.status(404).json({ error: 'Student not found' });
  res.json(updated);
});
// PUT update a student's details (name, phone, batch, fee)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, parent_phone = '', batch = '', monthly_fee = 0 } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Student name is required' });
  }

  const result = db.prepare(`
    UPDATE students
    SET name = ?, parent_phone = ?, batch = ?, monthly_fee = ?
    WHERE id = ?
  `).run(name.trim(), parent_phone.trim(), batch.trim(), Number(monthly_fee) || 0, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE a student permanently
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ deleted: true, id: Number(id) });
});

module.exports = router;