const express = require('express');
const cors = require('cors');

const studentsRouter = require('./routes/students');
const attendanceRouter = require('./routes/attendance');
const feesRouter = require('./routes/fees');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/fees', feesRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});