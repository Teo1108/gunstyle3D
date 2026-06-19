import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, Check, CreditCard, Apple, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartItem = ({ item, updateQuantity, removeItem }) => (
  <div style={{ 
    background: 'var(--bg-dark)', 
    borderRadius: '24px', 
    padding: '16px', 
    display: 'flex', 
    gap: '16px', 
    marginBottom: '16px', 
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.03)'
  }}>
    <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', overflow: 'hidden', padding: '4px' }}>
      <img src={item.catalogImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'lighten' }} />
    </div>
    
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '80px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: 600, color: 'white' }}>{item.name}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{item.category}</p>
        </div>
        <div style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>
          {item.price.toFixed(0)}€
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Minus size={14} /></button>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={14} /></button>
        </div>
        <button onClick={() => removeItem(item.id)} style={{ background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.2)', color: '#ff4d4f', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', transition: 'all 0.2s' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, updateCart, removeCartItem, fetchCart } = useCart();
  const [discountCode, setDiscountCode] = useState('NEURAL10');
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCheckout = (items, dCode) => {
    if (items.length === 0) {
      setOrderData(null);
      return;
    }
    setLoading(true);
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, discountCode: dCode })
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false);
      if (data.success) {
        setOrderData(data.receipt);
      }
    })
    .catch(err => {
      setLoading(false);
      console.error(err);
    });
  };

  // Sync Checkout when Backend Cart Context changes
  useEffect(() => {
    if (!cartLoading) {
      fetchCheckout(cart, appliedDiscount);
    }
  }, [cart, appliedDiscount, cartLoading]);

  const applyDiscount = () => {
    fetch('/api/discounts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: discountCode })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setAppliedDiscount(discountCode);
        setErrorMsg('');
      } else {
        setErrorMsg(data.message);
        setAppliedDiscount(null);
      }
    });
  };

  const completeCheckout = () => {
    setLoading(true);
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, discountCode: appliedDiscount, finalize: true })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setTimeout(() => {
          fetchCart();
          navigate('/');
        }, 1200);
      }
    });
  };

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Header */}
      <header style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700 }}>Mi Carrito</h1>
        </div>
        <span style={{ background: 'rgba(138,43,226,0.15)', color: '#A970FF', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(138,43,226,0.3)' }}>
          {cart.reduce((s, i) => s + i.quantity, 0)} items
        </span>
      </header>

      <main className="page-main">
        {/* Progress Tracker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', padding: '0 10px' }}>
          <div style={{ position: 'absolute', top: '10px', left: '20px', right: '20px', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: '10px', left: '20px', right: '66%', height: '2px', background: '#A970FF', zIndex: 0 }}></div>
          
          {['Carrito', 'Envío', 'Pago'].map((step, i) => {
            const isActive = i === 0;
            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                <div style={{ 
                  width: '20px', height: '20px', 
                  borderRadius: '50%', 
                  background: isActive ? '#A970FF' : 'rgba(20,20,26,1)', 
                  border: `4px solid ${isActive ? 'var(--bg-surface)' : 'rgba(255,255,255,0.1)'}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isActive ? '0 0 0 2px #A970FF' : 'none'
                }}></div>
                <span style={{ fontSize: '12px', color: isActive ? '#A970FF' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{step}</span>
              </div>
            )
          })}
        </div>

        <div className="cart-layout">
          {/* Columna izquierda: items + descuento */}
          <div className="cart-col-items">
            {cartLoading && <p style={{color: 'var(--primary)', textAlign:'center'}}>Sincronizando carrito...</p>}
            {(!orderData && !cartLoading) && <p style={{ color:'var(--text-muted)', textAlign:'center', margin:'40px 0' }}>El carrito está vacío.</p>}
            {orderData && (
              <div style={{ marginBottom: '32px' }}>
                {orderData.items.map((item, idx) => (
                  <CartItem key={idx} item={item} updateQuantity={updateCart} removeItem={removeCartItem} />
                ))}
              </div>
            )}

            {orderData && (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Código de Descuento</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '16px 20px', borderRadius: 'var(--radius-full)', color: 'white', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <button onClick={applyDiscount} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer' }}>Aplicar</button>
                </div>
                {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>{errorMsg}</p>}
                {appliedDiscount && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#00e676', fontSize: '12px', fontWeight: 700, background: 'rgba(0, 230, 118, 0.1)', padding: '8px 16px', borderRadius: 'var(--radius-full)', width: 'max-content' }}>
                    <Check size={14} strokeWidth={3} /> {appliedDiscount} APLICADO
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna derecha: resumen + pago + checkout */}
          <div className="cart-col-summary">
            {orderData && (
              <div style={{ marginBottom: '32px', background: 'var(--bg-dark)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="flex-between" style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <span>Subtotal</span>
                  <span style={{ color: 'white', fontWeight: 500 }}>{orderData.subtotal}€</span>
                </div>
                <div className="flex-between" style={{ marginBottom: '16px', color: orderData.discountAmount > 0 ? '#00e676' : 'var(--text-muted)', fontSize: '14px' }}>
                  <span>Descuento</span>
                  <span style={{ fontWeight: 500 }}>-{orderData.discountAmount.toFixed(2)}€</span>
                </div>
                <div className="flex-between" style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <span>Envío</span>
                  <span style={{ color: '#A970FF', fontWeight: 600 }}>{orderData.shipping === 0 ? 'GRATIS' : orderData.shipping + '€'}</span>
                </div>
                <div className="flex-between" style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>Total</span>
                  <span style={{ fontSize: '28px', color: '#A970FF', fontWeight: 800 }}>{orderData.total.toFixed(2)}€</span>
                </div>
              </div>
            )}

            {orderData && (
              <div style={{ background: 'var(--bg-dark)', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={20} color="var(--text-muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Dirección de envío</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'white' }}>Calle Principal 123, Madrid</p>
                </div>
                <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}

            {orderData && (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Método de Pago</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1px solid #A970FF', background: 'rgba(138,43,226,0.1)', color: '#A970FF', borderRadius: '20px', cursor: 'pointer' }}>
                    <CreditCard size={24} />
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>CARD</span>
                  </button>
                  <button style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-dark)', color: 'var(--text-muted)', borderRadius: '20px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, fontStyle: 'italic', lineHeight: '24px' }}>P</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>PAYPAL</span>
                  </button>
                  <button style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-dark)', color: 'var(--text-muted)', borderRadius: '20px', cursor: 'pointer' }}>
                    <Apple size={24} />
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>APPLE</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={completeCheckout}
              disabled={!orderData || loading}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                color: 'white',
                fontSize: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(138,43,226,0.4)',
                transition: 'all 0.2s',
                marginBottom: '20px',
                opacity: (!orderData || loading) ? 0.5 : 1
              }}>
              <span style={{ fontWeight: 600 }}>Pago y Completar</span>
              <span style={{ fontWeight: 800 }}>{orderData ? orderData.total.toFixed(2) + '€' : '...'}</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Cart;
