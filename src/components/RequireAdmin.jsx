import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken, authFetch, clearAdminToken } from '../utils/adminAuth';

const RequireAdmin = ({ children }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    authFetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('authenticated');
        } else {
          clearAdminToken();
          setStatus('unauthenticated');
        }
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  if (status === 'checking') {
    return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center' }}>Verificando sesión...</div>;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default RequireAdmin;
