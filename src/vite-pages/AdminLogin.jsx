import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdminToken, getAdminToken, authFetch } from '../utils/adminAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    authFetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => { if (data.success) navigate('/admin/dashboard'); })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setAdminToken(data.token);
          navigate('/admin/dashboard');
        } else {
          setError(data.message || 'Contraseña incorrecta');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Error de conexión');
      });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '360px', padding: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>🔒 Admin GunStyle</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
        />
        {error && <p style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
