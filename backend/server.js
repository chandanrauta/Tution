const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const { initDb } = require('./db');
const requireAuth = require('./middleware/auth');
const authRouter = require('./routes/auth');
const studentsRouter = require('./routes/students');
const attendanceRouter = require('./routes/attendance');
const feesRouter = require('./routes/fees');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/students', requireAuth, studentsRouter);
app.use('/api/attendance', requireAuth, attendanceRouter);
app.use('/api/fees', requireAuth, feesRouter);

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SaaS Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });