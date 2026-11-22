import { useEffect, useState } from 'react';
import { getStudents, addStudent, updateStudent, toggleStudent, deleteStudent, groupByBatch } from '../api';

const EMPTY_FORM = { name: '', batch: '', parent_phone: '', monthly_fee: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  async function load() {
    setStudents(await getStudents(true));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      await updateStudent(editingId, form);
      setEditingId(null);
    } else {
      await addStudent(form);
    }
    setForm(EMPTY_FORM);
    load();
  }

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      batch: s.batch || '',
      parent_phone: s.parent_phone || '',
      monthly_fee: s.monthly_fee ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
        <input
          placeholder="Batch (e.g. Class 10)"
          value={form.batch}
          onChange={(e) => setForm({ ...form, batch: e.target.value })}
        />
        <input
          placeholder="Parent Phone"
          value={form.parent_phone}
          onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
        />
        <input
          type="number"
          placeholder="Monthly Fee (₹)"
          value={form.monthly_fee}
          onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            {editingId ? 'Update Student' : 'Register Student'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
          )}
        </div>
      </form>

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