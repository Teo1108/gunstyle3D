'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken, authFetch, clearAdminToken } from '@/utils/adminAuth';

interface AdminProtectedProps {
  children: React.ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

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
    router.push('/admin');
    return null;
  }

  return <>{children}</>;
}
