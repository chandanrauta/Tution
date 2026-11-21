import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, getAttendance, getFees } from '../api';

export default function Dashboard() {
  const [summary, setSummary] = useState({ students: 0, present: 0, absent: 0, pendingFees: 0 });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    Promise.all([getStudents(), getAttendance(today), getFees(month)]).then(
      ([students, att, fees]) => {
        const present = att.records.filter((r) => r.status === 'PRESENT').length;
        const absent = att.records.filter((r) => r.status === 'ABSENT').length;
        const pendingFees = fees.records
          .filter((r) => r.status === 'PENDING')
          .reduce((sum, r) => sum + r.amount, 0);

        setSummary({ students: students.length, present, absent, pendingFees });
      }
    );
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats-row">
        <div className="card">Active Students<div className="big">{summary.students}</div></div>
        <div className="card">Today Present / Absent<div className="big">{summary.present} / {summary.absent}</div></div>
        <div className="card">Pending Fees (This Month)<div className="big">₹{summary.pendingFees}</div></div>
      </div>

      <div className="tabs">
        <Link to="/students" className="btn-primary">+ Register Student</Link>
        <Link to="/attendance" className="btn-outline">Take Attendance</Link>
        <Link to="/fees" className="btn-outline">Collect Fees</Link>
      </div>
    </div>
  );
}