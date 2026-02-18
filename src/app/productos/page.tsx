import { Suspense } from "react"
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ProductGridClient from '@/components/ProductGridClient'
import ProductFilters from '@/components/ProductFilters'
import Pagination from '@/components/Pagination'
import { headers } from "next/headers";
import { createClient } from '@/lib/supabase/server';

const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

const mockProducts = [
  { id: 1, name: 'Sazón Lopeza', price_estimated: 15.99, image_url: '/placeholder.png', category: { slug: 'condimentos-y-especias' } },
  { id: 2, name: 'Ají Amarillo', price_estimated: 12.50, image_url: '/placeholder.png', category: { slug: 'pastas-y-salsas' } },
  { id: 3, name: 'Culantro Fresco', price_estimated: 8.99, image_url: '/placeholder.png', category: { slug: 'condimentos-y-especias' } },
  { id: 4, name: 'Tari en Polvo', price_estimated: 10.00, image_url: '/placeholder.png', category: { slug: 'condimentos-y-especias' } },
]

// Configuración de paginación
const DEFAULT_LIMIT = 20;

async function getCategories() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("categories")
      .select("name, slug")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const h = headers();
    const host = h.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    // Construir query params para la API
    const params = new URLSearchParams();
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
    const offers = searchParams.offers;
    const categoria = typeof searchParams.categoria === 'string' ? searchParams.categoria : undefined;
    const q =
      (searchParams?.q as string) ??
      (searchParams?.query as string) ??
      "";
    const query = q.trim() || undefined;

    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;

    // Agregar todos los parámetros relevantes
    if (sort !== 'newest') params.set('sort', sort);
    if (offers === '1') params.set('offers', '1');
    if (categoria) params.set('categoria', categoria);
    if (query) params.set('q', query);
    params.set('page', String(page));
    params.set('limit', String(DEFAULT_LIMIT));

    const url = `${protocol}://${host}/api/products?${params.toString()}`;

    // DEBUG LOGS
    console.log("=== DEBUG FRONTEND ===");
    console.log("PARAMS received:", JSON.stringify(searchParams));
    console.log("categoria extracted:", categoria);
    console.log("FETCHING URL:", url);
    // END DEBUG

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const json = await res.json();

    // La API responde { products: [...], pagination: {...} }
    const products = Array.isArray(json) ? json : (json.products ?? []);
    const pagination = json.pagination;

    return { products, pagination };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: mockProducts, pagination: { total: mockProducts.length, page: 1, totalPages: 1, hasMore: false } };
  }
}

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const categoria = typeof params.categoria === 'string' ? params.categoria : undefined;
  const q =
    (params?.q as string) ??
    (params?.query as string) ??
    "";
  const query = q.trim() || undefined;


  console.log("=== DEBUG PAGE ===");
  console.log("params:", JSON.stringify(params));
  console.log("params.categoria:", params.categoria);
  console.log("categoria extracted:", categoria);
  console.log("=== END DEBUG PAGE ===");

  const categories = await getCategories();
  const label = categories.find((c: any) => c.slug === categoria)?.name ?? "Productos";

  const { products, pagination } = await getProducts(params);

  // Si page es mayor que totalPages, ajustar a la última página válida
  if (pagination.totalPages > 0 && pagination.page > pagination.totalPages) {
    const validParams = new URLSearchParams();
    validParams.set('page', String(pagination.totalPages));
    // Mantener otros filtros
    if (params.sort && params.sort !== 'newest') validParams.set('sort', String(params.sort));
    if (params.offers === '1') validParams.set('offers', '1');
    if (categoria) validParams.set('categoria', categoria);
    if (query) validParams.set('q', query);
    redirect(`/productos?${validParams.toString()}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Saludo */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{label}</h1>
        <p className="text-[#FF3131] font-medium">¿Cómo estás, kausa?</p>
      </div>

      {/* Filtros y Ordenamiento */}
      <Suspense fallback={null}>
        <ProductFilters totalProducts={pagination.total} />
      </Suspense>

      {/* Products Grid */}
      <ProductGridClient products={products} />

      {/* Paginación */}
      <Suspense fallback={null}>
        <Pagination pagination={pagination} />
      </Suspense>
    </main>
  );
}
