const BASE = '/api';

function authHeaders(extra = {}) {
  const token = localStorage.getItem('tuition_token') || '';
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function handleJson(res) {
  if (res.status === 401) {
    localStorage.removeItem('tuition_token');
    localStorage.removeItem('tuition_institute');
    window.location.reload();
    return {};
  }
  return res.json();
}

export async function loginInstitute(data) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function signupInstitute(data) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getStudents(all = false) {
  const res = await fetch(`${BASE}/students${all ? '?all=true' : ''}`, { headers: authHeaders() });
  return handleJson(res);
}

export async function addStudent(student) {
  const res = await fetch(`${BASE}/students`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(student),
  });
  return handleJson(res);
}

export async function bulkImportStudents(students) {
  const res = await fetch(`${BASE}/students/bulk`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ students }),
  });
  return handleJson(res);
}
export async function updateStudent(id, student) {
  const res = await fetch(`${BASE}/students/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(student),
  });
  return handleJson(res);
}

export async function toggleStudent(id) {
  const res = await fetch(`${BASE}/students/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function deleteStudent(id) {
  const res = await fetch(`${BASE}/students/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function getAttendance(date) {
  const res = await fetch(`${BASE}/attendance?date=${date}`, { headers: authHeaders() });
  return handleJson(res);
}

export async function saveAttendance(date, records) {
  const res = await fetch(`${BASE}/attendance`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ date, records }),
  });
  return handleJson(res);
}

export async function getFees(month) {
  const res = await fetch(`${BASE}/fees?month=${month}`, { headers: authHeaders() });
  return handleJson(res);
}

export async function toggleFee(id) {
  const res = await fetch(`${BASE}/fees/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return handleJson(res);
}
export async function payPartialFee(id, pay_amount) {
  const res = await fetch(`${BASE}/fees/${id}/pay`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ pay_amount }),
  });
  return handleJson(res);
}

export async function getStudentFeeHistory(studentId) {
  const res = await fetch(`${BASE}/fees/student/${studentId}`, { headers: authHeaders() });
  return handleJson(res);
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