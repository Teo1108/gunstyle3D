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

const STORAGE_KEY = 'gs_cart';
const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function writeStorage(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(() => {
    setCart(readStorage());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateCart = useCallback((productId: string, quantity: number, size?: string) => {
    setCart(prev => {
      const next = [...prev];
      const idx = next.findIndex(i => i.productId === productId && i.size === size);
      if (idx >= 0) {
        if (quantity <= 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], quantity };
      } else if (quantity > 0) {
        next.push({ productId, quantity, size });
      }
      writeStorage(next);
      return next;
    });
  }, []);

  const addToCart = useCallback((productId: string, size?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId && i.size === size);
      const next = existing
        ? prev.map(i => i.productId === productId && i.size === size
            ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { productId, quantity: 1, size }];
      writeStorage(next);
      return next;
    });
  }, []);

  const removeCartItem = useCallback((productId: string, size?: string) => {
    setCart(prev => {
      const next = prev.filter(i => !(i.productId === productId && i.size === size));
      writeStorage(next);
      return next;
    });
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
