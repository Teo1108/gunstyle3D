import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const filters = ['All', 'T-Shirts', 'Accessories', 'Hoodies'];
  const { addToCart } = useCart();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(res => {
        if (res.success) setProducts(res.data);
      })
      .catch(err => console.error("Error cargando productos desde Backend:", err));
  }, []);

  if (products.length === 0) return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center', fontFamily: 'var(--font-display)' }}>Conectando al servidor...</div>;

  const featured = products[0]; // Premium Black Tee
  const displayedProducts = activeFilter === 'All' 
    ? products.slice(1) 
    : products.filter(p => p.category === activeFilter);

  return (
    <div style={{ paddingBottom: '100px' }}>
      <Header />
      
      <main className="page-main">
        {/* Featured Product */}
        <section style={{ marginBottom: '32px' }}>
          <div className="glass-panel featured-product animate-fade-in" style={{
            padding: '24px',
            display: 'flex',
            background: 'linear-gradient(180deg, rgba(20,20,26,0.3) 0%, rgba(20,20,26,0.8) 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '180px',
              height: '180px',
              background: 'var(--primary)',
              filter: 'blur(90px)',
              opacity: 0.25,
              zIndex: 0
            }}></div>
            
            <div className="featured-image" style={{ zIndex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <img src={featured.catalogImage} style={{ width: '100%', maxWidth: '280px', height: '100%', objectFit: 'cover', borderRadius: '16px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }} alt={featured.name} />
              
              <span style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                background: 'rgba(138,43,226,0.2)', 
                color: 'var(--primary)', 
                padding: '6px 12px', 
                fontSize: '10px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 800,
                border: '1px solid rgba(138,43,226,0.5)',
                letterSpacing: '1px'
              }}>
                LIMITED EDITION
              </span>
            </div>
            
            <div className="featured-info" style={{ zIndex: 1, position: 'relative' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>Exclusive Item</span>
                <span style={{ fontSize: '22px', color: 'var(--primary)', fontWeight: 800 }}>${featured.price.toFixed(2)}</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'white' }}>{featured.name}</h2>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <span style={{ width: '16px', height: '16px', background: '#222', borderRadius: '50%', border: '2px solid var(--primary)' }}></span>
                <span style={{ width: '16px', height: '16px', background: 'var(--primary)', borderRadius: '50%' }}></span>
                <span style={{ width: '16px', height: '16px', background: '#eee', borderRadius: '50%' }}></span>
              </div>
              
              <button 
                onClick={() => addToCart(featured.id)}
                className="btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                background: activeFilter === filter ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeFilter === filter ? 'white' : 'var(--text-muted)',
                border: `1px solid ${activeFilter === filter ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {filter}
            </button>
          ))}
        </section>

        {/* Product Grid */}
        <section className="product-grid" style={{ display: 'grid', gap: '16px' }}>
          {displayedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      </main>
    </div>
  );
};

export default Home;
