import BannerCarousel from "@/components/BannerCarousel";
import Categories from "@/components/Categories";
import ProductGridClient from "@/components/ProductGridClient";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";
export const dynamic = "force-dynamic";
export const revalidate = 0;


export default async function Page() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  // Si falla la query, no rompas el home: muestra vacío
  const safeProducts: Product[] = (products as Product[]) ?? [];

  return (
    <main>
    

      <div className="px-4">
        <BannerCarousel />
      </div>

      {/* Categorías (usa tu componente real, NO hardcode) */}
      <section className="py-2">
        <h2 className="text-3xl font-bold text-center">Categorías</h2>
        <div className="mt-1">
          <Categories />
        </div>
      </section>

      {/* Ofertas y Novedades (PRODUCTOS REALES) */}
      <section className="py-0">
        <h2 className="text-3xl font-bold text-center">Ofertas y Novedades</h2>

        {error ? (
          <p className="text-center mt-6 text-red-600">
            Error cargando productos: {error.message}
          </p>
        ) : (
          <div className="mt-6 px-4">
            <ProductGridClient products={safeProducts} />
          </div>
        )}
      </section>
    </main>
  );
}
