const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addColumnIfMissing(table, column, definition) {
  const info = await db.execute(`PRAGMA table_info(${table})`);
  const exists = info.rows.some((col) => col.name === column);
  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS institutes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institute_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      upi_id TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institute_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      parent_phone TEXT,
      batch TEXT,
      monthly_fee INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      joined_at TEXT NOT NULL DEFAULT (date('now')),
      FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institute_id INTEGER NOT NULL DEFAULT 1,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT')),
      UNIQUE(student_id, date),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fee_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institute_id INTEGER NOT NULL DEFAULT 1,
      student_id INTEGER NOT NULL,
      billing_month TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PAID')),
      paid_at TEXT,
      UNIQUE(student_id, billing_month),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  await addColumnIfMissing('students', 'institute_id', 'INTEGER NOT NULL DEFAULT 1');
  await addColumnIfMissing('attendance', 'institute_id', 'INTEGER NOT NULL DEFAULT 1');
  await addColumnIfMissing('fee_records', 'institute_id', 'INTEGER NOT NULL DEFAULT 1');
  await addColumnIfMissing('fee_records', 'paid_amount', 'INTEGER NOT NULL DEFAULT 0');
  await db.execute("UPDATE fee_records SET paid_amount = amount WHERE status = 'PAID' AND paid_amount = 0");

  console.log('Turso Cloud DB & multi-tenant tables ready!');
}

module.exports = { db, initDb };