import { useState } from 'react';
import { loginInstitute, signupInstitute } from '../api';

export default function Auth({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    institute_name: '',
    email: '',
    password: '',
    phone: '',
    upi_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isSignup ? await signupInstitute(form) : await loginInstitute(form);
      if (res.error) {
        setError(res.error);
      } else if (res.token) {
        localStorage.setItem('tuition_token', res.token);
        localStorage.setItem('tuition_institute', JSON.stringify(res.institute));
        onAuth(res.institute);
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '48px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />
          <div>
            <h2 style={{ margin: 0 }}>{isSignup ? 'Create Coaching Account' : 'Tutor Login'}</h2>
            <div className="sub">Manage students, attendance &amp; fees</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: 0 }}>
          {isSignup && (
            <input
              placeholder="Coaching / Institute Name *"
              value={form.institute_name}
              onChange={(e) => setForm({ ...form, institute_name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars) *"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
          {isSignup && (
            <>
              <input
                type="tel"
                placeholder="Tutor Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                placeholder="UPI ID for Fee Links (optional, e.g. name@upi)"
                value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
              />
            </>
          )}

          {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '14px' }}>
          {isSignup ? 'Already have an account? ' : 'New tutor? '}
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            style={{ background: 'none', color: '#2563eb', padding: 0, minHeight: 'auto' }}
          >
            {isSignup ? 'Login here' : 'Create free account'}
          </button>
        </div>
      </div>
    </div>
  );
}