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

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link href="/admin/productos" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow">
          <div className="text-2xl">📦</div>
          <div className="mt-3 text-xl font-semibold">Configuración</div>
          <div className="text-gray-600">Crear / editar / desactivar</div>
        </Link>

        <div className="rounded-2xl border bg-white p-6 opacity-60">
          <div className="text-2xl">🏷️</div>
          <div className="mt-3 text-xl font-semibold">Descuentos</div>
          <div className="text-gray-600">Próximo</div>
        </div>

        <div className="rounded-2xl border bg-white p-6 opacity-60">
          <div className="text-2xl">🖼️</div>
          <div className="mt-3 text-xl font-semibold">Imágenes</div>
          <div className="text-gray-600">Próximo</div>
        </div>
      </div>
    </main>
  );
}
