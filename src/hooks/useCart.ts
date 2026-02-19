import { useState, useEffect } from 'react';
import { Product } from '@/lib/supabase/types';

export interface CartItem {
  cartKey: string;        // product.id + ':' + (variant_id ?? 'base')
  productId: number;
  name: string;
  image_url: string;
  qty: number;
  variant_id?: number;    // ID de la variante
  variant_label?: string; // Label de la variante (ej: "500 g")
  unit_price: number;     // Precio unitario real (NO price_estimated)
}

const STORAGE_KEY = "peruwianka_cart";

function saveCart(nextCart: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
  // esto fuerza actualización instantánea en la MISMA pestaña
  window.dispatchEvent(new Event("cart_updated"));
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Genera la clave única para el carrito
function generateCartKey(productId: number, variantId?: number): string {
  return `${productId}:${variantId ?? 'base'}`;
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

  // Agregar item al carrito - trata cada variante como item distinto
  const addItem = (product: Product, qty: number = 1) => {
    const q = Math.max(1, Math.floor(Number(qty) || 1));
    const variantId = product.variant_id;
    const cartKey = generateCartKey(product.id, variantId);
    
    // unit_price: usar price_estimated (que ya tiene el precio correcto sea variante o no)
    const unitPrice = product.price_estimated;
    
    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        const next = prev.map(item =>
          item.cartKey === cartKey
            ? { ...item, qty: item.qty + q }
            : item
        );
        saveCart(next);
        return next;
      } else {
        const next = [...prev, {
          cartKey,
          productId: product.id,
          name: product.name,
          image_url: product.image_url,
          qty: q,
          variant_id: variantId,
          variant_label: product.variant_label,
          unit_price: unitPrice
        }];
        saveCart(next);
        return next;
      }
    });
  };

  // Remover item por cartKey
  const removeItem = (cartKey: string) => {
    setCart(prev => {
      const next = prev.filter(item => item.cartKey !== cartKey);
      saveCart(next);
      return next;
    });
  };

  // Incrementar cantidad por cartKey
  const inc = (cartKey: string) => {
    setCart(prev => {
      const next = prev.map(item =>
        item.cartKey === cartKey
          ? { ...item, qty: item.qty + 1 }
          : item
      );
      saveCart(next);
      return next;
    });
  };

  // Decrementar cantidad por cartKey
  const dec = (cartKey: string) => {
    setCart(prev => {
      const next = prev.map(item =>
        item.cartKey === cartKey && item.qty > 1
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

  // Total correcto usando unit_price
  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.qty, 0);
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

