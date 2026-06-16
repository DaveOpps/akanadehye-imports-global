"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type CartItem = {
  id: string | number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
};

export type SavedItem = Omit<CartItem, "quantity">;

export type CartNotification = {
  id: string | number;
  title: string;
  price: number;
  thumbnail: string;
};

type CartState = {
  items: CartItem[];
  saved: SavedItem[];
  count: number;
  subtotal: number;
  notification: CartNotification | null;
  clearNotification: () => void;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (id: string | number) => void;
  setQuantity: (id: string | number, quantity: number) => void;
  clear: () => void;
  saveForLater: (id: string | number) => void;
  moveToCart: (id: string | number) => void;
  removeSaved: (id: string | number) => void;
};

const CartCtx = createContext<CartState | null>(null);
const CART_KEY = "akanadehye-cart-v1";
const SAVED_KEY = "akanadehye-saved-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);

  useEffect(() => {
    try {
      const rawC = localStorage.getItem(CART_KEY);
      if (rawC) setItems(JSON.parse(rawC));
      const rawS = localStorage.getItem(SAVED_KEY);
      if (rawS) setSaved(JSON.parse(rawS));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {}
  }, [saved, hydrated]);

  const clearNotification = useCallback(() => setNotification(null), []);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { ...item, quantity }];
    });
    // Remove from saved-for-later if present
    setSaved((prev) => prev.filter((s) => s.id !== item.id));
    // Trigger the "Added to cart" toast
    setNotification({ id: item.id, title: item.title, price: item.price, thumbnail: item.thumbnail });
  }, []);

  const remove = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setQuantity = useCallback((id: string | number, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) => (p.id === id ? { ...p, quantity } : p))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const saveForLater = useCallback((id: string | number) => {
    setItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) {
        setSaved((s) =>
          s.some((x) => x.id === id) ? s : [{ id: item.id, title: item.title, price: item.price, thumbnail: item.thumbnail }, ...s]
        );
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const moveToCart = useCallback((id: string | number) => {
    setSaved((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item) {
        setItems((cart) => {
          const existing = cart.find((p) => p.id === id);
          if (existing) {
            return cart.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p));
          }
          return [...cart, { ...item, quantity: 1 }];
        });
      }
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const removeSaved = useCallback((id: string | number) => {
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo<CartState>(
    () => ({
      items,
      saved,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      notification,
      clearNotification,
      add,
      remove,
      setQuantity,
      clear,
      saveForLater,
      moveToCart,
      removeSaved,
    }),
    [items, saved, notification, clearNotification, add, remove, setQuantity, clear, saveForLater, moveToCart, removeSaved]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
