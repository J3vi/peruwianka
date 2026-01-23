import { useState, useEffect } from 'react';
import { Product } from '@/lib/supabase/types';

export interface CartItem {
  productId: number;
  name: string;
  price_estimated: number;
  image_url: string;
  qty: number;
}

const STORAGE_KEY = "peruwianka_cart";

function saveCart(nextCart: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
  // esto fuerza actualización instantánea en la MISMA pestaña
  window.dispatchEvent(new Event("cart_updated"));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCart(loadCart());
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const sync = () => setCart(loadCart());

    window.addEventListener("cart_updated", sync);
    // por si abres otra pestaña
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("cart_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addItem = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const next = prev.map(item =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
        saveCart(next);
        return next;
      } else {
        const next = [...prev, {
          productId: product.id,
          name: product.name,
          price_estimated: product.price_estimated,
          image_url: product.image_url,
          qty: 1
        }];
        saveCart(next);
        return next;
      }
    });
  };

  const removeItem = (productId: number) => {
    setCart(prev => {
      const next = prev.filter(item => item.productId !== productId);
      saveCart(next);
      return next;
    });
  };

  const inc = (productId: number) => {
    setCart(prev => {
      const next = prev.map(item =>
        item.productId === productId
          ? { ...item, qty: item.qty + 1 }
          : item
      );
      saveCart(next);
      return next;
    });
  };

  const dec = (productId: number) => {
    setCart(prev => {
      const next = prev.map(item =>
        item.productId === productId && item.qty > 1
          ? { ...item, qty: item.qty - 1 }
          : item
      );
      saveCart(next);
      return next;
    });
  };

  const clear = () => {
    setCart(prev => {
      const next: CartItem[] = [];
      saveCart(next);
      return next;
    });
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price_estimated * item.qty, 0);
  };

  const getCount = () => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  };

  return {
    cart,
    addItem,
    removeItem,
    inc,
    dec,
    clear,
    getTotal,
    getCount,
    isLoaded
  };
}
