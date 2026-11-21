const express = require('express');
const router = express.Router();
const db = require('../db');

// GET attendance sheet for a specific date (YYYY-MM-DD)
router.get('/', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT s.id AS student_id, s.name, s.batch, a.status
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
    WHERE s.is_active = 1
    ORDER BY s.name ASC
  `).all(date);

  res.json({ date, records: rows });
});

// POST save/update attendance for a date
router.post('/', (req, res) => {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'date and records array are required' });
  }

  const upsert = db.prepare(`
    INSERT INTO attendance (student_id, date, status)
    VALUES (?, ?, ?)
    ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
  `);

  db.exec('BEGIN');
  try {
    for (const r of records) {
      upsert.run(r.student_id, date, r.status);
    }
    db.exec('COMMIT');
    res.json({ saved: records.length, date });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;