'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant } from '@/lib/supabase/types';
import { useCart } from '@/hooks/useCart';
import { createClient } from '@/lib/supabase/client';

const formatPLN = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  window.dispatchEvent(
    new CustomEvent('peruwianka:toast', { detail: { message, type } })
  );
}

/**
 * Verifica si un descuento está activo
 */
function isDiscountActive(product: Product): boolean {
  const discount = Number(product.discount_percent ?? 0);
  if (discount <= 0) return false;
  if (!product.discount_until) return true;
  const until = new Date(product.discount_until).getTime();
  return until > Date.now();
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name, slug),
          brands(name, slug),
          product_variants(id, label, amount, unit, price, is_default, sort_order, is_active)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
        return;
      }

      const productData = data as Product;
      setProduct(productData);

      // Inicializar variante seleccionada
      if (productData.has_variants && productData.product_variants) {
        const activeVariants = productData.product_variants.filter(v => v.is_active);
        if (activeVariants.length > 0) {
          const defaultVariant = activeVariants.find(v => v.is_default) || activeVariants[0];
          setSelectedVariant(defaultVariant);
        }
      }

      setLoading(false);
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF3131]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
        <Link href="/productos" className="text-[#FF3131] hover:underline">
          Volver a productos
        </Link>
      </div>
    );
  }

  // Filtrar variantes activas (ya vienen ordenadas por API)
  const variants = (product.product_variants ?? []).filter(v => v.is_active);
  const hasActiveVariants = product.has_variants && variants.length > 0;

  // Calcular precio a mostrar
  const displayPrice = hasActiveVariants && selectedVariant
    ? selectedVariant.price
    : Number(product.price_estimated ?? 0);

  // Calcular precio final con descuento (solo si no hay variantes)
  const discount = Number(product.discount_percent ?? 0);
  const active = !hasActiveVariants && isDiscountActive(product);
  const finalPrice = active 
    ? +(displayPrice * (1 - discount / 100)).toFixed(2) 
    : displayPrice;

  // Handler para agregar al carrito
  const handleAddToCart = () => {
    if (hasActiveVariants && selectedVariant) {
      addItem({
        ...product,
        price_estimated: selectedVariant.price,
        variant_id: selectedVariant.id,
        variant_label: selectedVariant.label,
      });
    } else {
      addItem(product);
    }
    toast('Se ha agregado al carrito', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-[#FF3131]">Inicio</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/productos" className="text-gray-600 hover:text-[#FF3131]">Productos</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Imagen del producto */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.image_url || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Información del producto */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              {product.category && (
                <p className="text-gray-600 mb-2">
                  Categoría: <span className="font-medium">{product.category.name}</span>
                </p>
              )}

              {product.brand && (
                <p className="text-gray-600 mb-4">
                  Marca: <span className="font-medium">{product.brand.name}</span>
                </p>
              )}

              <p className="text-gray-700 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Selector de variantes */}
              {hasActiveVariants && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Selecciona una opción:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 text-sm rounded-full border-2 transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'bg-[#FF3131] text-white border-[#FF3131]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#FF3131] hover:text-[#FF3131]'
                        }`}
                      >
                        {variant.label}
                        <span className="ml-2 font-semibold">
                          {formatPLN(variant.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Precio */}
              <div className="mb-6">
                {active ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-green-600">
                      {formatPLN(finalPrice)}
                    </span>
                    <span className="text-lg line-through text-gray-400">
                      {formatPLN(displayPrice)}
                    </span>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-600 text-white">
                      -{discount}%
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-green-600">
                    {formatPLN(finalPrice)}
                  </span>
                )}
              </div>

              {/* Peso */}
              <p className="text-gray-600 mb-6">
                Peso: <span className="font-medium">{product.weight} kg</span>
              </p>

              {/* Botones Agregar al carrito / Ver carrito / Reservar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/carrito"
                  className="w-full border-2 border-[#FF3131] text-[#FF3131] py-3 px-4 rounded-lg text-base font-semibold hover:bg-red-50 transition-colors text-center"
                >
                  Ver carrito
                </Link>
                <Link
                  href="/checkout"
                  className="w-full bg-yellow-400 text-black py-3 px-4 rounded-lg text-base font-extrabold hover:bg-yellow-300 transition-colors text-center"
                >
                  Reservar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
