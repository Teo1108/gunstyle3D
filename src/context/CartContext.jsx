import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial cart from backend
  const fetchCart = () => {
    setLoading(true);
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCart(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching cart", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateCart = (productId, quantity) => {
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) setCart(data.data);
    });
  };

  const removeCartItem = (productId) => {
    fetch(`/api/cart/${productId}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) setCart(data.data);
    });
  };

  const addToCart = (productId) => {
    const existing = cart.find(c => c.productId === productId);
    const newQty = existing ? existing.quantity + 1 : 1;
    updateCart(productId, newQty);
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCart, removeCartItem, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
