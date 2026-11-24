const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const result = await db.execute({
    sql: `
      SELECT s.id AS student_id, s.name, s.batch, s.parent_phone, a.status
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ? AND a.institute_id = ?
      WHERE s.institute_id = ? AND s.is_active = 1
      ORDER BY s.name ASC
    `,
    args: [date, req.instituteId, req.instituteId],
  });
  res.json({ date, records: result.rows });
});

router.post('/', async (req, res) => {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'date and records array are required' });
  }

  const statements = records.map((r) => ({
    sql: `
      INSERT INTO attendance (institute_id, student_id, date, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
    `,
    args: [req.instituteId, r.student_id, date, r.status],
  }));

  await db.batch(statements, 'write');
  res.json({ saved: records.length, date });
});

module.exports = router;