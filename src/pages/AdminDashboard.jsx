import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { authFetch, clearAdminToken } from '../utils/adminAuth';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const loadProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { if (data.success) setProducts(data.data); });
  };

  useEffect(() => { loadProducts(); }, []);

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    authFetch(`/api/products/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { if (data.success) loadProducts(); });
  };

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin');
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Admin · Productos</h1>
        <button onClick={handleLogout} className="btn-icon" title="Cerrar sesión"><LogOut size={18} /></button>
      </div>

      <button
        onClick={() => navigate('/admin/new')}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <Plus size={18} /> Nuevo producto
      </button>

      {products.map(product => (
        <div key={product.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '12px' }}>
          <img src={product.catalogImage} alt={product.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{product.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>${product.price.toFixed(2)} · {product.category}</div>
          </div>
          <button onClick={() => navigate(`/admin/edit/${product.id}`)} className="btn-icon" style={{ width: '36px', height: '36px' }}><Pencil size={16} /></button>
          <button onClick={() => handleDelete(product.id)} className="btn-icon" style={{ width: '36px', height: '36px', color: '#ff4d4f' }}><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
