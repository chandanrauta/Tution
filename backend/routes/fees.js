const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET fees for a month
router.get('/', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  await db.execute({
    sql: `
      INSERT OR IGNORE INTO fee_records (institute_id, student_id, billing_month, amount)
      SELECT institute_id, id, ?, monthly_fee FROM students WHERE institute_id = ? AND is_active = 1
    `,
    args: [month, req.instituteId],
  });

  const result = await db.execute({
    sql: `
      SELECT f.*, s.name, s.batch, s.parent_phone
      FROM fee_records f
      JOIN students s ON s.id = f.student_id
      WHERE f.institute_id = ? AND f.billing_month = ?
      ORDER BY f.status DESC, s.name ASC
    `,
    args: [req.instituteId, month],
  });

  res.json({ month, records: result.rows });
});

// POST partial or custom fee payment
router.post('/:id/pay', async (req, res) => {
  const { id } = req.params;
  const payAmount = Number(req.body.pay_amount) || 0;
  if (payAmount <= 0) {
    return res.status(400).json({ error: 'Enter a valid payment amount' });
  }

  const existing = await db.execute({
    sql: 'SELECT * FROM fee_records WHERE id = ? AND institute_id = ?',
    args: [id, req.instituteId],
  });
  const record = existing.rows[0];
  if (!record) return res.status(404).json({ error: 'Fee record not found' });

  const newPaid = Math.min(record.amount, (record.paid_amount || 0) + payAmount);
  const newStatus = newPaid >= record.amount ? 'PAID' : 'PENDING';

  await db.execute({
    sql: `
      UPDATE fee_records
      SET paid_amount = ?, status = ?, paid_at = datetime('now')
      WHERE id = ? AND institute_id = ?
    `,
    args: [newPaid, newStatus, id, req.instituteId],
  });

  const updated = await db.execute({ sql: 'SELECT * FROM fee_records WHERE id = ?', args: [id] });
  res.json(updated.rows[0]);
});

// PATCH full toggle PENDING <-> PAID
router.patch('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  await db.execute({
    sql: `
      UPDATE fee_records
      SET
        paid_amount = CASE WHEN status = 'PENDING' THEN amount ELSE 0 END,
        status = CASE WHEN status = 'PENDING' THEN 'PAID' ELSE 'PENDING' END,
        paid_at = CASE WHEN status = 'PENDING' THEN datetime('now') ELSE NULL END
      WHERE id = ? AND institute_id = ?
    `,
    args: [id, req.instituteId],
  });

  const updated = await db.execute({
    sql: 'SELECT * FROM fee_records WHERE id = ? AND institute_id = ?',
    args: [id, req.instituteId],
  });
  if (updated.rows.length === 0) return res.status(404).json({ error: 'Fee record not found' });
  res.json(updated.rows[0]);
});

// GET last 6 months fee history for one student
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const result = await db.execute({
    sql: `
      SELECT billing_month, amount, paid_amount, status, paid_at
      FROM fee_records
      WHERE institute_id = ? AND student_id = ?
      ORDER BY billing_month DESC
      LIMIT 6
    `,
    args: [req.instituteId, studentId],
  });
  res.json(result.rows);
});

module.exports = router;