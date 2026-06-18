import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div
      className="glass-panel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/product/${product.id}`)}
      style={{ 
        position: 'relative',
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        padding: '12px',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <img
          src={product.catalogImage}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} 
        />
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(20,20,26,0.6)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isLiked ? '#ff4d4f' : 'white', transition: 'all 0.2s' }}
        >
          <Heart size={16} fill={isLiked ? '#ff4d4f' : 'none'} />
        </button>
        
        {product.isNew && (
          <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--radius-full)' }}>
            NEW
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: 'white', lineHeight: '1.4' }}>{product.name}</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{product.category}</p>
        </div>
        
        <div className="flex-between" style={{ marginTop: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>${product.price.toFixed(2)}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}
            style={{ 
              background: 'rgba(138,43,226,0.1)', 
              color: 'var(--primary)', 
              border: 'none', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
