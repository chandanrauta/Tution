import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <nav className="navbar">
          <strong className="brand">Tuition MVP</strong>
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