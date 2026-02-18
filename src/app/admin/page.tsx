'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Verifica admin por tu endpoint (/api/me)
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/cuenta");
          return;
        }
        const json = await res.json();
        if (!json?.isAdmin) {
          router.replace("/");
          return;
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  async function onLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Panel Admin</h1>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Panel Admin</h1>
          <p className="mt-2 text-gray-600">
            Aquí podrás gestionar productos, precios, stock y ofertas.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">

        <Link href="/admin/productos" className="block rounded-2xl border bg-white p-6 shadow-sm hover:shadow">
          <div className="text-2xl">📦</div>
          <h3 className="mt-3 text-xl font-semibold">Configuración</h3>
          <p className="text-gray-600">Crear / editar / desactivar</p>
        </Link>

        <Link href="/admin/restock" className="block rounded-2xl border bg-white p-6 shadow-sm hover:shadow">
          <div className="text-2xl">🛒</div>
          <h3 className="mt-3 text-xl font-semibold">Hacer pedido</h3>
          <p className="text-gray-600">Gestionar stock y generar recibos</p>
        </Link>

        <Link href="/admin/estadisticas" className="block rounded-2xl border bg-white p-6 shadow-sm hover:shadow">

          <div className="text-2xl">🏷️</div>
          <h3 className="mt-3 text-xl font-semibold">Estadísticas</h3>
          <p className="text-gray-600">Más vendidos, populares y sin movimiento</p>
        </Link>



        <Link href="/admin/banners" className="block rounded-2xl border bg-white p-6 shadow-sm hover:shadow">
          <div className="text-2xl">🖼️</div>
          <h3 className="mt-3 text-xl font-semibold">Banners</h3>
          <p className="text-gray-600">Crear / editar / desactivar</p>
        </Link>


        <Link href="/admin/ordenes" className="block rounded-2xl border bg-white p-6 shadow-sm hover:shadow">
          <div className="text-2xl">📋</div>
          <h3 className="mt-3 text-xl font-semibold">Órdenes</h3>
          <p className="text-gray-600">Ver pedidos, estado y detalle por cliente</p>
        </Link>

      </div>

    </main>
  );
}
