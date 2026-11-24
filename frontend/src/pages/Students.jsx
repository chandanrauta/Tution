import { useEffect, useState } from 'react';
import { getStudents, addStudent, bulkImportStudents, updateStudent, toggleStudent, deleteStudent, groupByBatch } from '../api';

const STANDARD_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

const EMPTY_FORM = { name: '', batchChoice: '10th', customBatch: '', parent_phone: '', monthly_fee: '' };

function normalizeBatch(raw = '') {
  return raw.trim().replace(/\s+/g, ' ').replace(/^(\d+)\s+(st|nd|rd|th)$/i, '$1$2');
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [error, setError] = useState('');

  async function load() {
    setStudents(await getStudents(true));
  }

  useEffect(() => { load(); }, []);

  function handlePhoneChange(val) {
    let digits = val.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    setForm({ ...form, parent_phone: digits.slice(0, 10) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Student name is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.parent_phone)) {
      setError('Enter a valid 10-digit Indian mobile number (starting with 6–9).');
      return;
    }

    const finalBatch =
      form.batchChoice === 'OTHER'
        ? normalizeBatch(form.customBatch)
        : form.batchChoice;

    if (!finalBatch) {
      setError('Please select or enter a class/batch.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      batch: finalBatch,
      parent_phone: form.parent_phone,
      monthly_fee: form.monthly_fee,
    };

    const res = editingId
      ? await updateStudent(editingId, payload)
      : await addStudent(payload);

    if (res.error) {
      setError(res.error);
      return;
    }

    setEditingId(null);
    setForm(EMPTY_FORM);
    load();
  }

  function startEdit(s) {
    setError('');
    setEditingId(s.id);
    const clean = normalizeBatch(s.batch || '');
    const isStandard = STANDARD_CLASSES.includes(clean);
    setForm({
      name: s.name || '',
      batchChoice: isStandard ? clean : 'OTHER',
      customBatch: isStandard ? '' : clean,
      parent_phone: s.parent_phone || '',
      monthly_fee: s.monthly_fee ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setError('');
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function downloadSampleCsv() {
    const sample = 'name,batch,parent_phone,monthly_fee\nRahul Das,10th,9876543210,1000\nPriya Sahu,9th,9123456789,800\n';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsvUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setError('CSV must have a header row and at least 1 student.');
      return;
    }

    const parsed = lines.slice(1).map((line) => {
      const [name = '', batch = '', parent_phone = '', monthly_fee = '0'] = line
        .split(',')
        .map((v) => v.replace(/^"|"$/g, '').trim());
      return { name, batch, parent_phone, monthly_fee };
    });

    const res = await bulkImportStudents(parsed);
    e.target.value = '';
    if (res.error) {
      setError(res.error);
      return;
    }
    alert(`Imported ${res.imported} students!` + (res.skipped?.length ? ` Skipped ${res.skipped.length} invalid row(s).` : ''));
    load();
  }

  async function handleToggle(id) {
    await toggleStudent(id);
    load();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Permanently delete ${name} and all their records?`)) return;
    await deleteStudent(id);
    load();
  }

  const grouped = groupByBatch(students);
  const batchNames = grouped.map(([b]) => b);
  const visibleGroups = selectedBatch === 'ALL' ? grouped : grouped.filter(([b]) => b === selectedBatch);

  return (
    <div>
      <h2>{editingId ? 'Edit Student' : 'Students'}</h2>
      <form onSubmit={handleSubmit} className="card form-grid">
        <input
          placeholder="Student Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <select
          value={form.batchChoice}
          onChange={(e) => setForm({ ...form, batchChoice: e.target.value })}
          style={{ width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '15px', background: '#f8fafc' }}
        >
          {STANDARD_CLASSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="OTHER">Other (Custom Batch)</option>
        </select>

        {form.batchChoice === 'OTHER' && (
          <input
            placeholder="Custom Batch (e.g. JEE Morning)"
            value={form.customBatch}
            onChange={(e) => setForm({ ...form, customBatch: e.target.value })}
            required
          />
        )}

        <input
          type="tel"
          placeholder="Parent WhatsApp (10-digit) *"
          value={form.parent_phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          maxLength={10}
          required
        />
        <input
          type="number"
          placeholder="Monthly Fee (₹)"
          value={form.monthly_fee}
          onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
        />

        {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            {editingId ? 'Update Student' : 'Register Student'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
          )}
        </div>
      </form>

      <div className="card row" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <strong>Bulk Import (CSV)</strong>
          <div className="sub">Columns: name, batch, parent_phone, monthly_fee</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" onClick={downloadSampleCsv} className="btn-outline" style={{ fontSize: '13px' }}>
            Sample CSV
          </button>
          <label className="btn-primary" style={{ fontSize: '13px', cursor: 'pointer', minHeight: '40px', padding: '9px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center' }}>
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
          </label>
        </div>
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
            {list.map((s) => (
              <div key={s.id} className={`card row ${!s.is_active ? 'muted' : ''}`}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="sub">Fee: ₹{s.monthly_fee}/mo · Phone: {s.parent_phone || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => startEdit(s)} className="btn-outline">Edit</button>
                  <button onClick={() => handleToggle(s.id)} className="btn-outline">
                    {s.is_active ? 'Archive' : 'Restore'}
                  </button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="btn-absent">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}