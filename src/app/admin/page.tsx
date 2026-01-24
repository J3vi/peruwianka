'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/cuenta");
          return;
        }
        const data = await res.json();
        if (!data?.isAdmin) {
          router.replace("/cuenta");
          return;
        }
        if (alive) setLoading(false);
      } catch {
        router.replace("/cuenta");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-gray-600">Cargando panel admin…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Panel Admin</h1>
      <p className="text-gray-600 mb-8">
        Aquí podrás gestionar productos, precios, stock y ofertas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/productos"
          className="rounded-xl border p-5 hover:shadow-md transition"
        >
          <div className="text-2xl mb-2">📦</div>
          <div className="font-semibold">Configuracion</div>
          <div className="text-sm text-gray-600">Crear / editar / desactivar</div>
        </Link>

        <div className="rounded-xl border p-5 opacity-60">
          <div className="text-2xl mb-2">🏷️</div>
          <div className="font-semibold">Descuentos</div>
          <div className="text-sm text-gray-600">Próximo</div>
        </div>

        <div className="rounded-xl border p-5 opacity-60">
          <div className="text-2xl mb-2">🖼️</div>
          <div className="font-semibold">Imágenes</div>
          <div className="text-sm text-gray-600">Próximo</div>
        </div>
      </div>
    </main>
  );
}
