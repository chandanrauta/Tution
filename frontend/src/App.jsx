import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Auth from './pages/Auth';

function getSavedInstitute() {
  try {
    const raw = localStorage.getItem('tuition_institute');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [institute, setInstitute] = useState(
    localStorage.getItem('tuition_token') ? getSavedInstitute() : null
  );

  function handleLogout() {
    localStorage.removeItem('tuition_token');
    localStorage.removeItem('tuition_institute');
    setInstitute(null);
  }

  if (!institute) {
    return <Auth onAuth={setInstitute} />;
  }

  return (
    <BrowserRouter>
      <div className="container">
        <nav className="navbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/logo.png"
                alt={institute.institute_name}
                style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '8px' }}
              />
              <strong className="brand">{institute.institute_name}</strong>
            </div>
            <button onClick={handleLogout} className="btn-outline" style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}>
              Logout
            </button>
          </div>
          <div className="nav-links">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/students">Students</NavLink>
            <NavLink to="/attendance">Attendance</NavLink>
            <NavLink to="/fees">Fees</NavLink>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/fees" element={<Fees />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}