"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import type { Product } from "@/lib/supabase/types";

const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

// Tipo local que extiende Product con category_slug para el carrusel
interface ProductWithSlug extends Product {
  category_slug?: string | null;
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

function toast(message: string, type: "success" | "error" | "info" = "success") {
  window.dispatchEvent(new CustomEvent("peruwianka:toast", { detail: { message, type } }));
}

export default function OffersCarouselClient({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  const scrollByCards = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(320, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!items.length) {
    return (
      <div className="border rounded-2xl p-6 bg-white">
        <h2 className="text-xl font-bold mb-2">Aún no hay ofertas</h2>
        <p className="text-gray-600">
          Cuando marques productos como oferta, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <section className="relative">
      {/* Controles */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={() => scrollByCards("left")}
          className="h-10 w-10 rounded-full border bg-white hover:bg-gray-50 flex items-center justify-center"
          aria-label="Anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollByCards("right")}
          className="h-10 w-10 rounded-full border bg-white hover:bg-gray-50 flex items-center justify-center"
          aria-label="Siguiente"
        >
          →
        </button>
      </div>

      {/* Carrusel */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map((p) => {
          const product = p as ProductWithSlug;
          const fav = isFavorite(String(product.id));
          const active = isDiscountActive(product);
          const price = Number(product.price_estimated ?? 0);
          const discount = Number(product.discount_percent ?? 0);
          const finalPrice = active ? +(price * (1 - discount / 100)).toFixed(2) : price;

          // Producto activo para reserva
          const isActive = product.is_active !== false;

          // Link "inteligente" por si existe tu ruta por categoría
          const href =
            product.category_slug ? `/productos?cat=${encodeURIComponent(product.category_slug)}` : "/productos";

          return (
            <div
              key={product.id}
              className="min-w-[260px] max-w-[260px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative h-40 bg-gray-200">
                <Image
                  src={product.image_url || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="260px"
                />

                {/* Corazón */}
                <button
                  type="button"
                  onClick={() => {
                    toggle({
                      id: String(product.id),
                      name: product.name,
                      price_estimated: product.price_estimated,
                      image_url: product.image_url || "/placeholder.png",
                    });
                    toast(fav ? "Eliminado de favoritos" : "Agregado a favoritos", "success");
                  }}
                  className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                  aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={fav ? "currentColor" : "none"}
                    className={fav ? "text-red-600" : "text-gray-700"}
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
                <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">{product.name}</h3>

                {/* Precio con descuento activo */}
                {active ? (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-green-600">{formatPLN(Number(finalPrice))}</span>
                    <span className="text-sm line-through opacity-60">{formatPLN(price)}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white">
                      -{discount}%
                    </span>
                  </div>
                ) : (
                  <p className="text-green-600 font-extrabold mb-3">{formatPLN(price)}</p>
                )}

                <div className="flex gap-2">
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        addItem(product);
                        toast("Se ha agregado al carrito", "success");
                      }}
                      className="flex-1 bg-[#FF3131] text-[#FC145] py-2 rounded-xl hover:bg-[#e62b2b] hover:text-[#f5b800] focus:outline-none focus:ring-2 focus:ring-[#FF3131]/40 font-semibold"
                    >
                      Reserva
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 bg-gray-400 text-white py-2 rounded-xl cursor-not-allowed font-semibold"
                    >
                      No disponible
                    </button>
                  )}

                  <Link
                    href={href}
                    className="px-4 py-2 rounded-xl border hover:bg-gray-50 font-semibold"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

