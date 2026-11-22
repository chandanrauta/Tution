import { useEffect, useState } from 'react';
import { getFees, toggleFee, groupByBatch } from '../api';

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export default function Fees() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
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

  const allGrouped = groupByBatch(records);
  const batchNames = allGrouped.map(([b]) => b);

  const statusFiltered = records.filter((r) => filter === 'ALL' || r.status === filter);
  const grouped = groupByBatch(statusFiltered);
  const visibleGroups = selectedBatch === 'ALL' ? grouped : grouped.filter(([b]) => b === selectedBatch);

  const pendingTotal = records.filter((r) => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
  const paidTotal = records.filter((r) => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <h2>Fee Tracker</h2>

      <div className="card row" style={{ marginBottom: '12px' }}>
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="btn-outline">◀ Prev</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>{formatMonthLabel(month)}</div>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            style={{ marginTop: '4px', padding: '4px 8px', fontSize: '12px' }}
          />
        </div>
        <button onClick={() => setMonth(shiftMonth(month, 1))} className="btn-outline">Next ▶</button>
      </div>

      <div className="stats-row">
        <div className="card">Pending: <strong>₹{pendingTotal}</strong></div>
        <div className="card">Collected: <strong>₹{paidTotal}</strong></div>
      </div>

      <div className="tabs">
        {['ALL', 'PENDING', 'PAID'].map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? 'btn-primary' : 'btn-outline'}>
            {tab}
          </button>
        ))}
      </div>

      {batchNames.length > 1 && (
        <div className="tabs" style={{ marginTop: '8px' }}>
          <button onClick={() => setSelectedBatch('ALL')} className={selectedBatch === 'ALL' ? 'btn-primary' : 'btn-outline'}>
            All Classes
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
              <div key={r.id} className="card row">
                <div>
                  <strong>{r.name}</strong>
                  <div className="sub">
                    ₹{r.amount} · {r.parent_phone || 'No phone'}
                    {r.status === 'PAID' && r.paid_at ? ` · Paid ${r.paid_at.slice(0, 10)}` : ''}
                  </div>
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
      ))}
    </div>
  );
}