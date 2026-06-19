import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const Catalog = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const filters = ['All', 'T-Shirts', 'Hoodies', 'Accessories'];

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(res => {
        if(res.success) setProducts(res.data);
      });
  }, []);

  const displayedProducts = activeFilter === 'All' 
    ? products 
    : products.filter(p => p.category === activeFilter);

  return (
    <div style={{ paddingBottom: '120px' }} className="animate-fade-in">
      {/* Header */}
      <header style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', margin: 0 }}>Catálogo</h1>
        </div>
      </header>

      <main className="page-main">
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            style={{ 
              width: '100%', 
              padding: '16px 16px 16px 48px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        {/* Filter and Sort bar */}
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <button className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: 'var(--text-main)', fontSize: '13px', cursor: 'pointer' }}>
            <SlidersHorizontal size={14} /> Filtros
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
            Ordenar: <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>Relevancia <ChevronDown size={14} /></span>
          </div>
        </div>

        {/* Categories */}
        <section style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                background: activeFilter === filter ? 'rgba(138,43,226,0.15)' : 'transparent',
                color: activeFilter === filter ? 'var(--primary)' : 'var(--text-muted)',
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
        {products.length === 0 ? <p style={{ color:'var(--primary)' }}>Cargando...</p> : (
          <section className="product-grid" style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
            {displayedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
        
        <button style={{ 
          width: '100%', 
          padding: '16px', 
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-main)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px'
        }}>
          Cargar más productos
        </button>
      </main>
    </div>
  );
};

export default Catalog;
