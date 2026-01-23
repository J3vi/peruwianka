"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setOk(
        "Listo ✅ Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve a la tienda."
      );
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err?.message ?? "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Crear una cuenta</h1>
          <p className="mt-2 text-slate-600">
            Guarda tus favoritos y tu historial. Sin drama.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico *
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña *
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Mínimo 6 caracteres"
              />
              <p className="mt-2 text-xs text-slate-500">
                Tip rápido: usa 8+ caracteres para que no te hackee “pepe123”.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {ok && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {ok}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-full bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear cuenta"}
            </button>

            <div className="pt-2 text-sm text-slate-600">
              ¿Ya tienes cuenta?{" "}
              <Link href="/cuenta" className="font-semibold text-blue-700 hover:underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </div>

        {/* Side info */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900">
            Tu cuenta te hace la vida fácil
          </h2>

          <ul className="mt-6 space-y-4 text-slate-700">
            <li className="flex gap-3">
              <span className="mt-1">✅</span>
              <span>Favoritos guardados y listos cuando vuelvas.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1">✅</span>
              <span>Historial de pedidos para repetir compras en segundos.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1">✅</span>
              <span>Promos y novedades (sin spam, palabra de peruano).</span>
            </li>
          </ul>

          <div className="mt-8 text-sm text-slate-600">
            Si solo estás mirando, tranqui: puedes seguir comprando igual.
          </div>
        </div>
      </div>
    </main>
  );
}
