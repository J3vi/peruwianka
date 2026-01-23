'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type FavItem = {
  productId: number;
  name: string;
  price_estimated: number;
  image_url: string;
};

const KEY = 'peruwianka_favorites';

function safeParse(json: string | null): FavItem[] {
  try {
    if (!json) return [];
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavItem[]>([]);

  // Cargar inicial (solo cliente)
  useEffect(() => {
    setFavorites(safeParse(localStorage.getItem(KEY)));
  }, []);

  // Guardar + notificar (misma pestaña + otras pestañas)
  const persist = useCallback((next: FavItem[]) => {
    setFavorites(next);
    localStorage.setItem(KEY, JSON.stringify(next));

    // Notificar a componentes en la misma pestaña
    window.dispatchEvent(
      new CustomEvent('peruwianka:favorites', { detail: next })
    );

    // Notificar a otras pestañas
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  }, []);

  // Escuchar cambios externos (otras pestañas o otros componentes)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== KEY) return;
      setFavorites(safeParse(localStorage.getItem(KEY)));
    };

    const onInternal = (e: Event) => {
      const ce = e as CustomEvent<FavItem[]>;
      if (Array.isArray(ce.detail)) setFavorites(ce.detail);
      else setFavorites(safeParse(localStorage.getItem(KEY)));
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('peruwianka:favorites', onInternal as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('peruwianka:favorites', onInternal as any);
    };
  }, []);

  const isFavorite = useCallback(
    (productId: number) => favorites.some(f => f.productId === productId),
    [favorites]
  );

  const add = useCallback((p: { id: number; name: string; price_estimated: number; image_url: string }) => {
    if (isFavorite(p.id)) return;
    persist([
      ...favorites,
      { productId: p.id, name: p.name, price_estimated: p.price_estimated, image_url: p.image_url }
    ]);
  }, [favorites, isFavorite, persist]);

  const remove = useCallback((productId: number) => {
    persist(favorites.filter(f => f.productId !== productId));
  }, [favorites, persist]);

  const toggle = useCallback((p: { id: number; name: string; price_estimated: number; image_url: string }) => {
    if (isFavorite(p.id)) remove(p.id);
    else add(p);
  }, [add, isFavorite, remove]);

  const clear = useCallback(() => persist([]), [persist]);

  const count = useMemo(() => favorites.length, [favorites]);

  return { favorites, count, isFavorite, add, remove, toggle, clear };
}
