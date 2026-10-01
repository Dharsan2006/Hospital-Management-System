import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import { Activity, Lock, Mail, ShieldAlert } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 460, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: 16, background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', marginBottom: 12 }}>
            <Activity size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>AURA HOSPITAL</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Hospital Management System</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', marginBottom: 20 }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{ paddingLeft: 38, width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: 38, width: '100%' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center', fontWeight: 600 }}>
            DEMO LOGIN ACCOUNTS (Password: Admin@123)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillQuickLogin('admin@example.com')}>ADMIN</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillQuickLogin('doctor@example.com')}>DOCTOR</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillQuickLogin('nurse@example.com')}>NURSE</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillQuickLogin('receptionist@example.com')}>RECEPTIONIST</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillQuickLogin('patient@example.com')}>PATIENT</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillQuickLogin('pharmacist@example.com')}>PHARMACIST</button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Need a patient account? <Link to="/register">Register Here</Link>
        </div>
      </div>
    </div>
  );
};
