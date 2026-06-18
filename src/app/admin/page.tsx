'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminToken, getAdminToken, authFetch } from '@/utils/adminAuth';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    authFetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => { if (data.success) router.push('/admin/dashboard'); })
      .catch(() => {});
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
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
          router.push('/admin/dashboard');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg-dark)' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '360px', padding: '32px', background: 'var(--bg-surface-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h2 style={{ color: 'white', marginBottom: '24px', fontFamily: 'var(--font-display)', fontSize: '20px' }}>🔒 Admin GunStyle</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
        />
        {error && <p style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
