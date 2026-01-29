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
      {/* Hero (como antes, verde) */}
      <section className="bg-green-600">
  <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
    <h1 className="text-5xl md:text-6xl font-extrabold text-center text-white tracking-tight">
      Productos peruanos en Polonia
    </h1>

    <p className="mt-5 text-center text-white/90 text-lg md:text-xl">
      Condimentos, snacks y ajíes auténticos. Reserva hoy y recibe en casa.
    </p>

    <div className="mt-8 flex justify-center gap-3">
      <a
        href="ofertas"
        className="inline-flex items-center justify-center rounded-full bg-white text-green-700 px-6 py-3 font-semibold hover:bg-white/90 transition"
      >
        Ver ofertas
      </a>

      <a
        href="categorias"
        className="inline-flex items-center justify-center rounded-full border border-white/60 text-white px-6 py-3 font-semibold hover:bg-white/10 transition"
      >
        Ver categorías
      </a>
    </div>
  </div>
</section>


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
