import { useEffect, useState } from 'react';
import { getFees, toggleFee, payPartialFee, getStudentFeeHistory, groupByBatch } from '../api';

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

function getInstituteInfo() {
  try {
    return JSON.parse(localStorage.getItem('tuition_institute') || '{}');
  } catch {
    return {};
  }
}

function getWhatsAppLink(record, monthLabel) {
  let digits = (record.parent_phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = '91' + digits.slice(1);
  else if (digits.length === 10) digits = '91' + digits;
  if (digits.length < 10) return null;

  const inst = getInstituteInfo();
  const instName = inst.institute_name || 'Triad Study Circle';
  const paid = record.paid_amount || 0;
  const remaining = Math.max(0, record.amount - paid);

  let msg;
  if (record.status === 'PAID') {
    msg = `ନମସ୍କାର! ${record.name} ଙ୍କର ${monthLabel} ମାସର ଟ୍ୟୁସନ୍ ଫି ₹${record.amount} ମିଳିଯାଇଛି। ଧନ୍ୟବାଦ! - ${instName}`;
  } else {
    const upiPart = inst.upi_id
      ? `\n\nUPI Link: upi://pay?pa=${encodeURIComponent(inst.upi_id)}&pn=${encodeURIComponent(instName)}&am=${remaining}&cu=INR`
      : '';
    msg = `ନମସ୍କାର! ${record.name} ଙ୍କର ${monthLabel} ମାସର ଟ୍ୟୁସନ୍ ଫି ₹${remaining} ବାକି ଅଛି। ଦୟାକରି ଶୀଘ୍ର ପୈଠ କରିବାକୁ ଅନୁରୋଧ। - ${instName}${upiPart}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

export default function Fees() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [records, setRecords] = useState([]);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);

  async function load() {
    const data = await getFees(month);
    setRecords(data.records || []);
  }

  useEffect(() => { load(); }, [month]);

  async function handleToggle(id) {
    await toggleFee(id);
    load();
  }

  async function handlePartialPay(r) {
    const remaining = Math.max(0, r.amount - (r.paid_amount || 0));
    const input = window.prompt(`Enter amount paid by ${r.name} (Remaining: ₹${remaining}):`, String(remaining));
    if (!input) return;
    const amt = Number(input);
    if (!amt || amt <= 0) return;
    await payPartialFee(r.id, amt);
    load();
  }

  async function toggleHistory(studentId) {
    if (openHistoryId === studentId) {
      setOpenHistoryId(null);
      return;
    }
    setOpenHistoryId(studentId);
    setHistoryRows(await getStudentFeeHistory(studentId));
  }

  function exportCsv() {
  const header = 'Name,Batch,Phone,Total Fee,Paid,Pending,Status,Paid At\n';
  const rows = records.map((r) => {
    const paid = r.paid_amount || 0;
    const pending = Math.max(0, r.amount - paid);
    return `"${r.name}","${r.batch || ''}","${r.parent_phone || ''}",${r.amount},${paid},${pending},${r.status},"${r.paid_at || ''}"`;
  });
  const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fees_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
  const monthLabel = formatMonthLabel(month);
  const allGrouped = groupByBatch(records);
  const batchNames = allGrouped.map(([b]) => b);

  const statusFiltered = records.filter((r) => filter === 'ALL' || r.status === filter);
  const grouped = groupByBatch(statusFiltered);
  const visibleGroups = selectedBatch === 'ALL' ? grouped : grouped.filter(([b]) => b === selectedBatch);

  const pendingTotal = records.reduce((sum, r) => sum + Math.max(0, r.amount - (r.paid_amount || 0)), 0);
  const paidTotal = records.reduce((sum, r) => sum + (r.paid_amount || 0), 0);

  return (
    <div>
      <h2><div className="header-row">
     <h2 style={{ margin: 0 }}>Fee Tracker</h2>
     <button onClick={exportCsv} className="btn-outline" style={{ fontSize: '13px' }}>
       Export CSV
     </button>
   </div>
   </h2>

      <div className="card row" style={{ marginBottom: '12px' }}>
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="btn-outline">◀ Prev</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>{monthLabel}</div>
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
            {list.map((r) => {
              const waLink = getWhatsAppLink(r, monthLabel);
              const paid = r.paid_amount || 0;
              const isPartial = r.status === 'PENDING' && paid > 0;
              return (
                <div key={r.id} className="card">
                  <div className="row">
                    <div>
                      <strong
                        onClick={() => toggleHistory(r.student_id)}
                        style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                        title="Tap for 6-month fee history"
                      >
                        {r.name}
                      </strong>
                      <div className="sub">
                        {isPartial ? `Paid ₹${paid} / ₹${r.amount}` : `₹${r.amount}`} · {r.parent_phone || 'No phone'}
                        {r.status === 'PAID' && r.paid_at ? ` · Paid ${r.paid_at.slice(0, 10)}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline"
                          style={{ color: '#15803d', borderColor: '#86efac' }}
                        >
                          {r.status === 'PAID' ? 'Receipt' : 'Remind'}
                        </a>
                      )}
                      {r.status === 'PENDING' && (
                        <button onClick={() => handlePartialPay(r)} className="btn-outline">
                          + Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(r.id)}
                        className={r.status === 'PAID' ? 'btn-present' : 'btn-absent'}
                      >
                        {r.status === 'PAID' ? 'PAID ✓' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>

                  {openHistoryId === r.student_id && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '13px' }}>
                      <strong>Last 6 Months:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {historyRows.map((h) => (
                          <span key={h.billing_month} className="tag" style={{ marginLeft: 0 }}>
                            {h.billing_month}: ₹{h.paid_amount || 0}/{h.amount} ({h.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}