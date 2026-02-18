'use client';

import Image from 'next/image';
import { Product } from '@/lib/supabase/types';
import { useFavorites } from '@/hooks/useFavorites';
import Link from 'next/link';

const formatPLN = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

interface ProductGridClientProps {
  products: Product[];
}

/**
 * Verifica si un descuento está activo según la regla:
 * discount_percent > 0 AND (discount_until IS NULL OR discount_until > NOW())
 */
function isDiscountActive(product: Product): boolean {
  const discount = Number(product.discount_percent ?? 0);
  if (discount <= 0) return false;
  if (!product.discount_until) return true;
  const until = new Date(product.discount_until).getTime();
  return until > Date.now();
}

function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  window.dispatchEvent(
    new CustomEvent('peruwianka:toast', { detail: { message, type } })
  );
}

// Componente individual de producto (grilla simplificada)
function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(String(product.id));

  // Obtener variantes activas
  const variants = (product.product_variants ?? []).filter(v => v.is_active);
  const hasActiveVariants = product.has_variants && variants.length > 0;
  
  // Precio a mostrar: variante default si tiene variantes, sino price_estimated
  const defaultVariant = hasActiveVariants 
    ? (variants.find(v => v.is_default) || variants[0])
    : null;
  
  const displayPrice = defaultVariant
    ? defaultVariant.price
    : Number(product.price_estimated ?? 0);

  // Calcular precio final con descuento (solo si no hay variantes)
  const discount = Number(product.discount_percent ?? 0);
  const active = !hasActiveVariants && isDiscountActive(product);
  const finalPrice = active 
    ? +(displayPrice * (1 - discount / 100)).toFixed(2) 
    : displayPrice;



  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen + corazón + CTA overlay */}
      <div className="relative h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
        <Image
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          width={300}
          height={192}
          className="w-full h-full object-cover"
        />

        {/* Corazón - top-right */}
        <button
          type="button"
          onClick={() => {
            toggle({
              id: String(product.id),
              name: product.name,
              price_estimated: product.price_estimated,
              image_url: product.image_url || '/placeholder.png',
            });

            toast(fav ? 'Eliminado de favoritos' : 'Agregado a favoritos', 'success');
          }}
          className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow z-10"
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

        {/* CTA "Más →" - bottom-right overlay */}
        {product.slug && (
          <Link
            href={`/productos/${product.slug}`}
            className="absolute bottom-2 right-2 z-10 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-white hover:border-[#FF3131] hover:text-[#FF3131] transition-colors shadow-sm"
          >
            Más →
          </Link>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>

        {/* Precio */}
        {active ? (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-green-600">{formatPLN(finalPrice)}</span>
            <span className="text-sm line-through opacity-60">{formatPLN(displayPrice)}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white">
              -{discount}%
            </span>
          </div>
        ) : (
          <span className="text-lg font-semibold text-green-600">{formatPLN(finalPrice)}</span>
        )}

        {product.slug ? (
          <Link
            href={`/productos/${product.slug}`}
            className="block w-full bg-[#FF3131] text-[#FC145] py-2 rounded-lg hover:bg-[#e62b2b] hover:text-[#f5b800] focus:outline-none focus:ring-2 focus:ring-[#FF3131]/40 mt-2 text-center"
          >
            Reserva
          </Link>
        ) : (
          <button
            type="button"
            disabled
            onClick={() => console.error('ProductGridClient: product.slug is undefined for product', product)}
            className="block w-full bg-gray-400 text-white py-2 rounded-lg cursor-not-allowed mt-2 text-center"
          >
            Reserva (Error)
          </button>
        )}

      </div>

    </div>
  );
}

export default function ProductGridClient({ products }: ProductGridClientProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
