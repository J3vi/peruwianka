'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProductRow = {
  id: number;
  name: string;
  price_estimated: number;
  is_active: boolean;
  category_id?: number | null;
  category?: { name: string } | null; // <- si tu API ya hace join
};

const formatPLN = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

export default function AdminProductosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) seguridad: solo admin
        const me = await fetch("/api/me", { cache: "no-store" });
        if (!me.ok) {
          router.replace("/cuenta");
          return;
        }
        const meJson = await me.json();
        if (!meJson?.isAdmin) {
          router.replace("/");
          return;
        }

        // 2) datos
        const res = await fetch("/api/admin/productos", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar productos");
        const json = await res.json();

        const list: ProductRow[] = Array.isArray(json?.products) ? json.products : [];
        if (alive) setProducts(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "No se pudo cargar productos");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-bold">Admin · Productos</h1>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-bold">Admin · Productos</h1>
        <p className="mt-2 text-red-600">{error}</p>
        <div className="mt-4 flex gap-4">
          <Link className="underline" href="/admin">Volver al panel</Link>
          <Link className="underline text-gray-600" href="/cuenta">Cerrar sesión</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Admin · Productos</h1>
          <p className="mt-2 text-gray-600">
            Lista de productos (edición viene en la siguiente micro-tarea).
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/admin" className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">
            Panel
          </Link>
          <Link href="/cuenta" className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">
            Cerrar sesión
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-sm text-gray-700">
              <th className="px-5 py-3 w-[90px]">ID</th>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3 w-[220px]">Categoría</th>
              <th className="px-5 py-3 w-[160px]">Precio</th>
              <th className="px-5 py-3 w-[120px]">Activo</th>
              <th className="px-5 py-3 w-[140px]">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="text-sm">
                <td className="px-5 py-4">{p.id}</td>
                <td className="px-5 py-4 font-medium">{p.name}</td>

                <td className="px-5 py-4 text-gray-700">
                  {/* Si tu API ya trae join -> p.category.name */}
                  {p.category?.name ?? (p.category_id ? `#${p.category_id}` : "—")}
                </td>

                <td className="px-5 py-4">{formatPLN(p.price_estimated)}</td>

                <td className="px-5 py-4">
                  {p.is_active ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Sí</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">No</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td className="px-5 py-10 text-gray-600" colSpan={6}>
                  No hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
