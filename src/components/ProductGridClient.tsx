'use client';

import Image from 'next/image';
import { Product } from '@/lib/supabase/types';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';

const formatPLN = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

interface ProductGridClientProps {
  products: Product[];
}

function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  window.dispatchEvent(
    new CustomEvent('peruwianka:toast', { detail: { message, type } })
  );
}

export default function ProductGridClient({ products }: ProductGridClientProps) {
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const fav = isFavorite(product.id);

        return (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Imagen + corazón */}
            <div className="relative h-48 bg-gray-200 flex items-center justify-center">
              <Image
                src={product.image_url || '/placeholder.png'}
                alt={product.name}
                width={300}
                height={192}
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={() => {
                  toggle({
                    id: product.id,
                    name: product.name,
                    price_estimated: product.price_estimated,
                    image_url: product.image_url || '/placeholder.png',
                  });

                  toast(fav ? 'Eliminado de favoritos' : 'Agregado a favoritos', 'success');
                }}
                className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                {/* corazón */}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={fav ? 'currentColor' : 'none'}
                  className={fav ? 'text-red-600' : 'text-gray-700'}
                >
                  <path
                    d="M12 21s-7-4.35-9.5-8.5C.5 9.5 2.5 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.5 0 5.5 3 3.5 6.5C19 16.65 12 21 12 21Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              {(() => {
                const price = Number(product.price_estimated ?? 0);
                const discount = Number(product.discount_percent ?? 0);
                const finalPrice = discount > 0 ? +(price * (1 - discount / 100)).toFixed(2) : price;

                return discount > 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-green-600">{formatPLN(finalPrice)}</span>
                    <span className="text-sm line-through opacity-60">{formatPLN(price)}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white">
                      -{discount}%
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-green-600">{formatPLN(price)}</span>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  addItem(product);
                  toast('Se ha agregado al carrito', 'success');
                }}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mt-2"
              >
                Reserva
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
