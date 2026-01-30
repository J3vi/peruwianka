'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

type FavoriteItem = {
  productId: number;
  name: string;
  price_estimated: number;
  image_url: string;
};

const STORAGE_KEY = 'peruwianka_favorites';

const formatPLN = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

function safeReadFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteFavorites(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // Para que otras partes de la app se enteren al instante (si lo escuchas)
  window.dispatchEvent(new Event('peruwianka_favorites_updated'));
}

export default function FavoritosPage() {
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const refresh = () => setFavorites(safeReadFavorites());

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };

    const onCustom = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener('peruwianka_favorites_updated', onCustom as any);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('peruwianka_favorites_updated', onCustom as any);
    };
  }, []);

  const removeFavorite = (productId: number) => {
    const next = favorites.filter((f) => f.productId !== productId);
    setFavorites(next);
    safeWriteFavorites(next);
    showToast('Quitado de favoritos');
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Favoritos</h1>
          <p className="text-gray-600">Tus productos guardados.</p>
        </div>

        <Link
          href="/productos"
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          Ver productos
        </Link>
      </div>

      <div className="mt-3 mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-gray-800">
        <span className="font-semibold">Tip:</span> Tus favoritos se guardan por ahora en este dispositivo.
            </div>

      {favorites.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-700">
          No tienes favoritos todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((p) => (
            <div
              key={p.productId}
              className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  width={300}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{p.name}</h3>
                <p className="text-green-600 font-bold">{formatPLN(p.price_estimated)}</p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      addItem({
                        id: p.productId,
                        name: p.name,
                        price_estimated: p.price_estimated,
                        image_url: p.image_url,
                      } as any);
                      showToast('Se ha agregado al carrito');
                    }}
                    className="flex-1 bg-[#FF3131] text-[#FC145] py-2 rounded-lg hover:bg-[#e62b2b] hover:text-[#f5b800] focus:outline-none focus:ring-2 focus:ring-[#FF3131]/40"
                  >
                    Reserva
                  </button>

                  <button
                    onClick={() => removeFavorite(p.productId)}
                    className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                    title="Quitar de favoritos"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-black/80 text-white px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
