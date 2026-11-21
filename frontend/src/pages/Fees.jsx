import { useEffect, useState } from 'react';
import { getFees, toggleFee } from '../api';

export default function Fees() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState('ALL');
  const [records, setRecords] = useState([]);

  async function load() {
    const data = await getFees(month);
    setRecords(data.records);
  }

  useEffect(() => { load(); }, [month]);

  async function handleToggle(id) {
    await toggleFee(id);
    load();
  }

  const visible = records.filter((r) => filter === 'ALL' || r.status === filter);
  const pendingTotal = records.filter((r) => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
  const paidTotal = records.filter((r) => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="header-row">
        <h2>Fee Tracker</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="stats-row">
        <div className="card">Pending: <strong>₹{pendingTotal}</strong></div>
        <div className="card">Collected: <strong>₹{paidTotal}</strong></div>
      </div>

      <div className="tabs">
        {['ALL', 'PENDING', 'PAID'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={filter === tab ? 'btn-primary' : 'btn-outline'}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="list">
        {visible.map((r) => (
          <div key={r.id} className="card row">
            <div>
              <strong>{r.name}</strong> {r.batch && <span className="tag">{r.batch}</span>}
              <div className="sub">₹{r.amount} · {r.parent_phone || 'No phone'}</div>
            </div>
            <button
              onClick={() => handleToggle(r.id)}
              className={r.status === 'PAID' ? 'btn-present' : 'btn-absent'}
            >
              {r.status === 'PAID' ? 'PAID ✓' : 'Mark Paid'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}