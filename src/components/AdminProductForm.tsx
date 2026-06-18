'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useProductForm } from '@/hooks/useProductForm';
import { ALL_SIZES } from '@/utils/sizes';
import { authFetch } from '@/utils/adminAuth';
import AdminProtected from '@/components/AdminProtected';

const CATEGORIES = ['T-Shirts', 'Hoodies', 'Accessories'];

interface AdminProductFormProps {
  initialProduct?: any;
  productId?: string;
}

function AdminProductFormContent({ initialProduct, productId }: AdminProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useProductForm(initialProduct);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    authFetch('/api/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        setUploading(false);
        if (data.success) form.addImage(data.path);
      })
      .catch(() => setUploading(false));
    e.target.value = '';
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    form.addImage(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = async () => {
    if (!form.isValid) {
      setError('Completá nombre, precio y al menos una foto.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await form.save(productId);
      setSaving(false);
      if (data.success) router.push('/admin/dashboard');
      else setError(data.message || 'Error al guardar');
    } catch {
      setSaving(false);
      setError('Error de conexión');
    }
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>
          {productId ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Fotos */}
        <section>
          <div style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>📷 Fotos del producto</div>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed var(--primary)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '12px' }}
          >
            {uploading ? 'Subiendo...' : '+ Subir foto'}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: 'none' }} />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="O pegar URL de imagen"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={handleAddUrl} style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontWeight: 600 }}>Agregar</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {form.images.map(img => (
              <div
                key={img}
                onClick={() => form.selectCatalogImage(img)}
                style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${form.catalogImage === img ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', aspectRatio: '1/1' }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {form.catalogImage === img && (
                  <span style={{ position: 'absolute', top: '4px', left: '4px', background: 'var(--primary)', color: 'white', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>CATÁLOGO</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); form.removeImage(img); }}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                >✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Información */}
        <section>
          <div style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>📝 Información</div>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Nombre</div>
            <input type="text" value={form.name} onChange={e => form.setName(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
          </label>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Categoría</div>
            <select value={form.category} onChange={e => form.setCategory(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Precio (USD)</div>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => form.setPrice(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
          </label>

          <label style={{ display: 'block', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Descripción</div>
            <textarea value={form.description} onChange={e => form.setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
          </label>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px' }}>Talles disponibles</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ALL_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => form.toggleSize(size)}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-lg)', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    background: form.sizes[size] ? 'rgba(138,43,226,0.15)' : 'var(--bg-surface)',
                    color: form.sizes[size] ? 'var(--primary)' : 'var(--text-muted)',
                    border: `1px solid ${form.sizes[size] ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontWeight: 600 }}>
              {saving ? 'Guardando...' : '💾 Guardar producto'}
            </button>
            <button onClick={() => router.push('/admin/dashboard')} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminProductFormWrapper(props: AdminProductFormProps) {
  return (
    <AdminProtected>
      <AdminProductFormContent {...props} />
    </AdminProtected>
  );
}
