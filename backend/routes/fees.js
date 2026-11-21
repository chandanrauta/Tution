const express = require('express');
const router = express.Router();
const db = require('../db');

// GET fee records for a month (YYYY-MM), auto-creating pending rows for active students
router.get('/', (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  db.prepare(`
    INSERT OR IGNORE INTO fee_records (student_id, billing_month, amount)
    SELECT id, ?, monthly_fee FROM students WHERE is_active = 1
  `).run(month);

  const rows = db.prepare(`
    SELECT f.*, s.name, s.batch, s.parent_phone
    FROM fee_records f
    JOIN students s ON s.id = f.student_id
    WHERE f.billing_month = ?
    ORDER BY f.status DESC, s.name ASC
  `).all(month);

  res.json({ month, records: rows });
});

// PATCH toggle PENDING <-> PAID for a fee record
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;
  db.prepare(`
    UPDATE fee_records
    SET
      status = CASE WHEN status = 'PENDING' THEN 'PAID' ELSE 'PENDING' END,
      paid_at = CASE WHEN status = 'PENDING' THEN datetime('now') ELSE NULL END
    WHERE id = ?
  `).run(id);

  const updated = db.prepare('SELECT * FROM fee_records WHERE id = ?').get(id);
  if (!updated) return res.status(404).json({ error: 'Fee record not found' });
  res.json(updated);
});

module.exports = router;