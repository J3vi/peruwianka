import Image from 'next/image'
import Link from 'next/link'
import ProductGridClient from '@/components/ProductGridClient'
import { headers } from "next/headers";

const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

const mockProducts = [
  { id: 1, name: 'Sazón Lopeza', price_estimated: 15.99, image_url: '/placeholder.png', category: { slug: 'sazonadores' } },
  { id: 2, name: 'Ají Amarillo', price_estimated: 12.50, image_url: '/placeholder.png', category: { slug: 'ajies' } },
  { id: 3, name: 'Culantro Fresco', price_estimated: 8.99, image_url: '/placeholder.png', category: { slug: 'sazonadores' } },
  { id: 4, name: 'Tari en Polvo', price_estimated: 10.00, image_url: '/placeholder.png', category: { slug: 'sazonadores' } },
]

const categories = [
  { name: "Condimentos y Especies", slug: "sazonadores" },
  { name: "Pastas y salsas", slug: "ajies" },
  { name: "Granos", slug: "granos" },
  { name: "Bebidas", slug: "bebidas" },
  { name: "Snacks", slug: "snacks" },
  { name: "Marcas", slug: "marcas" },
];

async function getProducts() {
  try {
    const h = headers();
    const host = h.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    const res = await fetch(`${protocol}://${host}/api/products`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return mockProducts;
  }
}

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const categoria = typeof params.categoria === 'string' ? params.categoria : undefined
  const query = typeof params.query === 'string' ? params.query : undefined

  const label = categories.find(c => c.slug === categoria)?.name ?? "Productos"

  let products = await getProducts()

  if (categoria) {
    products = products.filter((p: any) => p.category?.slug === categoria)
  }

  if (query) {
    products = products.filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase()))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{label}</h1>

      {/* Products Grid */}
      <ProductGridClient products={products} />
    </main>
  );
}
