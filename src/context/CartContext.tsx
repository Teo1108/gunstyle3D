"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type CartItem = { productId: string; quantity: number; size?: string };

type CartContextValue = {
  cart: CartItem[];
  loading: boolean;
  addToCart: (productId: string, size?: string) => void;
  updateCart: (productId: string, quantity: number, size?: string) => void;
  removeCartItem: (productId: string, size?: string) => void;
  fetchCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(() => {
    setLoading(true);
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCart(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateCart = useCallback((productId: string, quantity: number, size?: string) => {
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, size }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCart(d.data); });
  }, []);

  const addToCart = useCallback((productId: string, size?: string) => {
    const existing = cart.find((c) => c.productId === productId && c.size === size);
    updateCart(productId, existing ? existing.quantity + 1 : 1, size);
  }, [cart, updateCart]);

  const removeCartItem = useCallback((productId: string, size?: string) => {
    const query = size ? `?size=${encodeURIComponent(size)}` : "";
    fetch(`/api/cart/${productId}${query}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCart(d.data); });
  }, []);

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCart, removeCartItem, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
