"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
}

interface CartContextValue {
  items: CartItem[];
  /** False until the stored cart has been read, so the UI can avoid flicker. */
  ready: boolean;
  count: number;
  total: number;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  /** Replaces the cart wholesale, used after re-checking stock and prices. */
  replace: (items: CartItem[]) => void;
}

const STORAGE_KEY = "doni-shop-cart";

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.price === "number"
  );
}

/**
 * Holds the cart in localStorage. Every piece in the shop is one of a kind, so
 * a cart is a set of artwork ids with no quantities: adding something twice is
 * the same as adding it once.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Read once on mount. Storage can be unavailable (private windows, blocked
  // site data) or hold something we did not write, so never trust it.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter(isCartItem));
        }
      }
    } catch {
      // An unreadable cart is an empty cart, not a broken page.
    } finally {
      setReady(true);
    }
  }, []);

  // Persist after the first read, so an unreadable load cannot wipe the cart.
  useEffect(() => {
    if (!ready) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Out of quota or blocked: the cart still works for this page view.
    }
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((current) =>
      current.some((existing) => existing.id === item.id)
        ? current
        : [...current, item]
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const replace = useCallback((next: CartItem[]) => setItems(next), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.length,
      total: items.reduce((sum, item) => sum + item.price, 0),
      add,
      remove,
      clear,
      has: (id: string) => items.some((item) => item.id === id),
      replace,
    }),
    [items, ready, add, remove, clear, replace]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
