import { useEffect, useState } from 'react';
import { getAttendance, saveAttendance } from '../api';

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    setSavedMsg('');
    getAttendance(date).then((data) => {
      // Default unmarked students to PRESENT so you only tap absentees
      setRecords(
        data.records.map((r) => ({ ...r, status: r.status || 'PRESENT' }))
      );
    });
  }, [date]);

  function toggleStatus(studentId) {
    setSavedMsg('');
    setRecords((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? { ...r, status: r.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
          : r
      )
    );
  }

  async function handleSave() {
    await saveAttendance(
      date,
      records.map(({ student_id, status }) => ({ student_id, status }))
    );
    setSavedMsg(`Saved attendance for ${date}!`);
  }

  return (
    <div>
      <div className="header-row">
        <h2>Daily Attendance</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="list">
        {records.map((r) => (
          <div key={r.student_id} className="card row">
            <div>
              <strong>{r.name}</strong> {r.batch && <span className="tag">{r.batch}</span>}
            </div>
            <button
              onClick={() => toggleStatus(r.student_id)}
              className={r.status === 'PRESENT' ? 'btn-present' : 'btn-absent'}
            >
              {r.status}
            </button>
          </div>
        ))}
      </div>

      {records.length > 0 && (
        <div className="actions">
          <button onClick={handleSave} className="btn-primary">Save Attendance</button>
          {savedMsg && <span className="saved">{savedMsg}</span>}
        </div>
      )}
    </div>
  );
}