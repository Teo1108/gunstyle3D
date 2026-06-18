import React from 'react';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', path: '/', icon: Home, label: 'Inicio' },
    { id: 'catalog', path: '/catalog', icon: LayoutGrid, label: 'Catálogo' },
    { id: 'cart', path: '/cart', icon: ShoppingBag, label: 'Carrito' },
    { id: 'profile', path: '#', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '400px',
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderRadius: 'var(--radius-full)',
      zIndex: 1000,
      background: 'rgba(20, 20, 26, 0.85)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <div 
            key={item.id} 
            onClick={() => item.path !== '#' && navigate(item.path)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.2s',
              transform: isActive ? 'translateY(-2px)' : 'none'
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, opacity: isActive ? 1 : 0.7 }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
