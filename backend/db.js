const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Creates (or opens) tuition.db inside the backend folder
const db = new DatabaseSync(path.join(__dirname, 'tuition.db'));

// Enable foreign keys so attendance and fees stay linked to valid students
db.exec('PRAGMA foreign_keys = ON;');

// Create the 3 core tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_phone TEXT,
    batch TEXT,
    monthly_fee INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT')),
    UNIQUE(student_id, date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fee_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    billing_month TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PAID')),
    paid_at TEXT,
    UNIQUE(student_id, billing_month),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );
`);

console.log('Database initialized successfully.');

module.exports = db;