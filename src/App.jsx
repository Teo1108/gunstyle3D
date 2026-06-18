
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProduct from './pages/AdminProduct';
import RequireAdmin from './components/RequireAdmin';
import BottomNav from './components/BottomNav';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { Monitor, Smartphone, Tablet, Lightbulb, LightbulbOff } from 'lucide-react';
import './App.css';

// Inner component so it can consume the PreferencesContext
function AppShell() {
  const { device, theme, setDevice, toggleTheme, deviceWidths } = usePreferences();

  return (
    <>
      {/* Floating Device / Theme Toggles */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
        display: 'flex', gap: '8px',
        background: 'var(--bg-surface-glass)', padding: '8px',
        borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
        backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        {/* Phone */}
        <button
          className="btn-icon"
          style={{ width: '36px', height: '36px', background: device === 'mobile' ? 'var(--primary)' : 'var(--bg-surface-glass)', color: device === 'mobile' ? 'white' : 'var(--text-main)' }}
          onClick={() => setDevice('mobile')}
          title="Teléfono"
        >
          <Smartphone size={16} />
        </button>

        {/* Tablet */}
        <button
          className="btn-icon"
          style={{ width: '36px', height: '36px', background: device === 'tablet' ? 'var(--primary)' : 'var(--bg-surface-glass)', color: device === 'tablet' ? 'white' : 'var(--text-main)' }}
          onClick={() => setDevice('tablet')}
          title="Tablet"
        >
          <Tablet size={16} />
        </button>

        {/* Desktop */}
        <button
          className="btn-icon"
          style={{ width: '36px', height: '36px', background: device === 'desktop' ? 'var(--primary)' : 'var(--bg-surface-glass)', color: device === 'desktop' ? 'white' : 'var(--text-main)' }}
          onClick={() => setDevice('desktop')}
          title="Escritorio"
        >
          <Monitor size={16} />
        </button>

        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Theme toggle */}
        <button
          className="btn-icon"
          style={{ width: '36px', height: '36px' }}
          onClick={toggleTheme}
          title="Fondo claro / oscuro"
        >
          {theme === 'dark'
            ? <Lightbulb size={18} color="var(--text-main)" />
            : <LightbulbOff size={18} color="var(--text-main)" />}
        </button>
      </div>

      {/* Responsive viewport container */}
      <div
        className={`page-container device-${device} animate-fade-in`}
        style={{
          maxWidth: deviceWidths[device],
          transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          margin: '0 auto',
          borderLeft: device !== 'mobile' ? '1px solid var(--border)' : 'none',
          borderRight: device !== 'mobile' ? '1px solid var(--border)' : 'none',
          background: 'var(--bg-dark)',
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/new" element={<RequireAdmin><AdminProduct /></RequireAdmin>} />
          <Route path="/admin/edit/:id" element={<RequireAdmin><AdminProduct /></RequireAdmin>} />
        </Routes>
        <BottomNav />
      </div>
    </>
  );
}

function App() {
  return (
    <PreferencesProvider>
      <CartProvider>
        <Router>
          <AppShell />
        </Router>
      </CartProvider>
    </PreferencesProvider>
  );
}

export default App;
