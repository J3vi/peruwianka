import BannerCarousel from "@/components/BannerCarousel";
import Categories from "@/components/Categories";
import ProductGridClient from "@/components/ProductGridClient";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

type Banner = {
  image_url: string;
  link_url: string | null;
  created_at: string;
  updated_at: string | null;
};

export const revalidate = 86400;

export default async function Page() {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // 1) Ofertas: productos con discount_percent > 0 y descuento activo
  const { data: offersNull, error: offersErrorNull } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .gt("discount_percent", 0)
    .is("discount_until", null)
    .order("created_at", { ascending: false });

  const { data: offersFuture, error: offersErrorFuture } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .gt("discount_percent", 0)
    .gt("discount_until", nowIso)
    .order("created_at", { ascending: false });

  // Combinar y dedupe
  const offersMap = new Map<number, Product>();
  (offersNull ?? []).forEach((p: any) => {
    if (p?.id) offersMap.set(p.id, p as Product);
  });
  (offersFuture ?? []).forEach((p: any) => {
    if (p?.id) offersMap.set(p.id, p as Product);
  });

  const offers = Array.from(offersMap.values()).slice(0, 12);
  const offersError = offersErrorNull || offersErrorFuture;

  // 2) Novedades: últimos productos (solo activos)
  const { data: newest, error: newestError } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(12);

  // 3) Merge: ofertas primero, completar con novedades sin duplicados
  const offersSafe: Product[] = (offers as Product[]) ?? [];
  const newestSafe: Product[] = (newest as Product[]) ?? [];

  const seen = new Set<string | number>();
  const merged: Product[] = [];

  for (const p of offersSafe) {
    if (!p?.id) continue;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
    if (merged.length >= 12) break;
  }

  if (merged.length < 12) {
    for (const p of newestSafe) {
      if (!p?.id) continue;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      merged.push(p);
      if (merged.length >= 12) break;
    }
  }

  // Manejo de errores unificado
  const error = offersError || newestError;

  // 4) Banners (server)
  const { data: bannersData } = await supabase
    .from("banners")
    .select("image_url, link_url, created_at, updated_at")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const banners: Banner[] = (bannersData as Banner[]) ?? [];

  return (
    <main>
      <div className="px-4 bg-[#FFF7E6]">
  <BannerCarousel banners={banners} />
</div>
      {/* Categorías */}
      <section className="py-2">
        <h2 className="text-3xl font-bold text-center">Categorías</h2>
        <div className="mt-1">
          <Categories />
        </div>
      </section>

      {/* Ofertas y Novedades */}
      <section className="py-0">
        <h2 className="text-3xl font-bold text-center">Ofertas y Novedades</h2>

        {error ? (
          <p className="text-center mt-6 text-red-600">
            Error cargando productos: {error.message}
          </p>
        ) : (
          <div className="mt-6 px-4">
            <ProductGridClient products={merged} />
          </div>
        )}
      </section>
      </main>
);
}