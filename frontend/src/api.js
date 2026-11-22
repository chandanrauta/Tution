const BASE = '/api';

export async function getStudents(all = false) {
  const res = await fetch(`${BASE}/students${all ? '?all=true' : ''}`);
  return res.json();
}

export async function addStudent(student) {
  const res = await fetch(`${BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  return res.json();
}

export async function updateStudent(id, student) {
  const res = await fetch(`${BASE}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  return res.json();
}

export async function toggleStudent(id) {
  const res = await fetch(`${BASE}/students/${id}/toggle`, { method: 'PATCH' });
  return res.json();
}

export async function deleteStudent(id) {
  const res = await fetch(`${BASE}/students/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function getAttendance(date) {
  const res = await fetch(`${BASE}/attendance?date=${date}`);
  return res.json();
}

export async function saveAttendance(date, records) {
  const res = await fetch(`${BASE}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, records }),
  });
  return res.json();
}

export async function getFees(month) {
  const res = await fetch(`${BASE}/fees?month=${month}`);
  return res.json();
}

export async function toggleFee(id) {
  const res = await fetch(`${BASE}/fees/${id}/toggle`, { method: 'PATCH' });
  return res.json();
}
export function groupByBatch(items) {
  const groups = {};
  for (const item of items) {
    const key = (item.batch || '').trim() || 'Other / No Batch';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'Other / No Batch') return 1;
    if (b === 'Other / No Batch') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}