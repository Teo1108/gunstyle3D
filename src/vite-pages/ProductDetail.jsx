import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProductGallery } from '../hooks/useProductGallery';
import { ALL_SIZES } from '../utils/sizes';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setProduct(data.data); });
  }, [id]);

  const gallery = useProductGallery(product?.images || []);

  if (!product) {
    return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center' }}>Cargando producto...</div>;
  }

  return (
    <div style={{ paddingBottom: '120px' }}>
      <header style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: 0 }}>{product.name}</h1>
      </header>

      <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', margin: '0 16px', background: 'rgba(0,0,0,0.2)' }}>
        <img src={gallery.selectedImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {gallery.total > 1 && (
          <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
            {gallery.selectedIndex + 1} / {gallery.total}
          </span>
        )}
      </div>

      {gallery.total > 1 && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
          {product.images.map((img, i) => (
            <div
              key={img}
              onClick={() => gallery.selectImage(i)}
              style={{ width: '56px', height: '56px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', border: `2px solid ${i === gallery.selectedIndex ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer' }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      <main className="page-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{product.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{product.category}</p>
          </div>
          <span style={{ color: 'var(--primary)', fontSize: '22px', fontWeight: 800 }}>${product.price.toFixed(2)}</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: '12px 0 20px' }}>{product.description}</p>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Talle</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ALL_SIZES.map(size => {
              const enabled = Boolean(product.sizes?.[size]);
              return (
                <span
                  key={size}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-lg)', fontSize: '12px', fontWeight: 700,
                    background: enabled ? 'rgba(138,43,226,0.15)' : 'var(--bg-surface)',
                    color: enabled ? 'var(--primary)' : 'var(--text-muted)',
                    border: `1px solid ${enabled ? 'var(--primary)' : 'var(--border)'}`,
                    textDecoration: enabled ? 'none' : 'line-through',
                  }}
                >
                  {size}
                </span>
              );
            })}
          </div>
        </div>

        <button onClick={() => addToCart(product.id)} className="btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ShoppingCart size={18} /> Agregar al carrito
        </button>
      </main>
    </div>
  );
};

export default ProductDetail;
