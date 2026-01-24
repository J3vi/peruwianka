import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OffersCarouselClient from "@/components/OffersCarouselClient";

export default async function OfertasPage() {
  const supabase = await createClient();

  // Intento 1: si tienes columna is_offer (boolean)
  let products: any[] = [];
  const tryOffers = await supabase
    .from("products")
    .select("*")
    .eq("is_offer", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (!tryOffers.error && tryOffers.data?.length) {
    products = tryOffers.data;
  } else {
    // Fallback: si NO existe is_offer, igual mostramos "últimos productos"
    const fallback = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24);

    products = fallback.data ?? [];
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Ofertas</h1>
          <p className="text-gray-600">
            Productos que están entrando en oferta.
          </p>
        </div>

        <Link
          href="/productos"
          className="text-green-700 font-semibold hover:underline"
        >
          Ver todo
        </Link>
      </div>

      <OffersCarouselClient products={products} />
    </main>
  );
}
