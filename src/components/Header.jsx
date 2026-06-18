import React from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="flex-between animate-fade-in" style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>AUTOMATIZADO</span>
        <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700 }}>GunStile</h1>
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn-icon">
          <Search size={22} color="white" />
        </button>
        <button className="btn-icon" style={{ position: 'relative' }} onClick={() => navigate('/cart')}>
          <ShoppingBag size={22} color="white" />
          {cartItemsCount > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: '8px', 
              right: '8px', 
              background: 'var(--primary)', 
              width: '18px', 
              height: '18px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '10px', 
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(138,43,226,0.5)'
            }}>
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
