'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { authFetch, clearAdminToken } from '@/utils/adminAuth';
import AdminProtected from '@/components/AdminProtected';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  catalogImage: string;
}

function AdminDashboardContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { if (data.success) setProducts(data.data); });
  };

  useEffect(() => { loadProducts(); }, []);

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    authFetch(`/api/products/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { if (data.success) loadProducts(); });
  };

  const handleLogout = () => {
    clearAdminToken();
    router.push('/admin');
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Admin · Productos</h1>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>

      <button
        onClick={() => router.push('/admin/new')}
        style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
      >
        <Plus size={18} /> Nuevo producto
      </button>

      {products.map(product => (
        <div key={product.id} style={{ background: 'var(--bg-surface-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '12px' }}>
          <img src={product.catalogImage} alt={product.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{product.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>${product.price.toFixed(2)} · {product.category}</div>
          </div>
          <button onClick={() => router.push(`/admin/edit/${product.id}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={16} />
          </button>
          <button onClick={() => handleDelete(product.id)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#ff4d4f', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminProtected>
      <AdminDashboardContent />
    </AdminProtected>
  );
}
