import { useEffect, useState } from 'react';
import { getAttendance, saveAttendance, groupByBatch } from '../api';

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    setSavedMsg('');
    getAttendance(date).then((data) => {
      setRecords(data.records.map((r) => ({ ...r, status: r.status || 'PRESENT' })));
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

  const grouped = groupByBatch(records);
  const batchNames = grouped.map(([b]) => b);
  const visibleGroups = selectedBatch === 'ALL' ? grouped : grouped.filter(([b]) => b === selectedBatch);

  return (
    <div>
      <div className="header-row">
        <h2>Daily Attendance</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {batchNames.length > 1 && (
        <div className="tabs" style={{ marginBottom: '10px' }}>
          <button onClick={() => setSelectedBatch('ALL')} className={selectedBatch === 'ALL' ? 'btn-primary' : 'btn-outline'}>
            All
          </button>
          {batchNames.map((b) => (
            <button key={b} onClick={() => setSelectedBatch(b)} className={selectedBatch === b ? 'btn-primary' : 'btn-outline'}>
              {b}
            </button>
          ))}
        </div>
      )}

      {visibleGroups.map(([batch, list]) => (
        <div key={batch} style={{ marginTop: '18px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', color: '#475569' }}>
            {batch} ({list.length})
          </h3>
          <div className="list" style={{ marginTop: 0 }}>
            {list.map((r) => (
              <div key={r.student_id} className="card row">
                <strong>{r.name}</strong>
                <button
                  onClick={() => toggleStatus(r.student_id)}
                  className={r.status === 'PRESENT' ? 'btn-present' : 'btn-absent'}
                >
                  {r.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {records.length > 0 && (
        <div className="actions">
          <button onClick={handleSave} className="btn-primary">Save Attendance</button>
          {savedMsg && <span className="saved">{savedMsg}</span>}
        </div>
      )}
    </div>
  );
}