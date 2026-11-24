import { useEffect, useState } from 'react';
import { getAttendance, saveAttendance, groupByBatch } from '../api';

function getAbsentWhatsAppLink(record, date) {
  let digits = (record.parent_phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = '91' + digits.slice(1);
  else if (digits.length === 10) digits = '91' + digits;
  if (digits.length < 10) return null;

  let instName = 'Triad Study Circle';
  try {
    const inst = JSON.parse(localStorage.getItem('tuition_institute') || '{}');
    if (inst.institute_name) instName = inst.institute_name;
  } catch {}

  const msg = `ନମସ୍କାର! ଆଜି (${date}) ${record.name} ଟ୍ୟୁସନ୍ କ୍ଲାସ୍‌ରେ ଅନୁପସ୍ଥିତ ଅଛନ୍ତି। - ${instName}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    setSavedMsg('');
    getAttendance(date).then((data) => {
      setRecords((data.records || []).map((r) => ({ ...r, status: r.status || 'PRESENT' })));
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
            {list.map((r) => {
              const absentLink = r.status === 'ABSENT' ? getAbsentWhatsAppLink(r, date) : null;
              return (
                <div key={r.student_id} className="card row">
                  <strong>{r.name}</strong>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {absentLink && (
                      <a
                        href={absentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline"
                        style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                      >
                        Alert
                      </a>
                    )}
                    <button
                      onClick={() => toggleStatus(r.student_id)}
                      className={r.status === 'PRESENT' ? 'btn-present' : 'btn-absent'}
                    >
                      {r.status}
                    </button>
                  </div>
                </div>
              );
            })}
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