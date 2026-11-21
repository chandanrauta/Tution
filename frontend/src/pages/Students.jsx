import { useEffect, useState } from 'react';
import { getStudents, addStudent, toggleStudent, deleteStudent } from '../api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', batch: '', parent_phone: '', monthly_fee: '' });

  async function load() {
    setStudents(await getStudents(true));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addStudent(form);
    setForm({ name: '', batch: '', parent_phone: '', monthly_fee: '' });
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

  return (
    <div>
      <h2>Students</h2>
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
        <button type="submit" className="btn-primary">Register Student</button>
      </form>

      <div className="list">
        {students.map((s) => (
          <div key={s.id} className={`card row ${!s.is_active ? 'muted' : ''}`}>
            <div>
              <strong>{s.name}</strong> {s.batch && <span className="tag">{s.batch}</span>}
              <div className="sub">Fee: ₹{s.monthly_fee}/mo · Phone: {s.parent_phone || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleToggle(s.id)} className="btn-outline">
                {s.is_active ? 'Archive' : 'Restore'}
              </button>
              <button onClick={() => handleDelete(s.id, s.name)} className="btn-absent">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}