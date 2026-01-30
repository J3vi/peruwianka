"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid credentials") || error.message.includes("invalid")) {
          throw new Error("Credenciales incorrectas. Verifica tu email y contraseña.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Por favor confirma tu correo electrónico primero.");
        }
        if (error.message.includes("User not found")) {
          throw new Error("No existe una cuenta con este email.");
        }
        throw error;
      }

      router.push("/cuenta");
    } catch (err: any) {
      setError(err?.message ?? "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail) {
      setError("Ingresa tu email para recuperar la contraseña.");
      return;
    }
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(magicEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      setOk("Listo ✅ Te enviamos un enlace a tu correo para resetear tu contraseña.");
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar el enlace de recuperación.");
    } finally {
      setLoading(false);
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setOk("Listo ✅ Te enviamos un enlace mágico a tu correo. Ábrelo para iniciar sesión.");
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Ingresar</h1>
          <p className="mt-2 text-slate-600">
            Accede a tu cuenta con email y contraseña.
          </p>

          {showMagicLink ? (
            <form onSubmit={onMagicLink} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Correo electrónico *
                </label>
                <input
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="tu@email.com"
                />
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
                {loading ? "Enviando..." : "Enviar enlace mágico"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMagicLink(false);
                  setError(null);
                  setOk(null);
                }}
                className="w-full text-sm text-slate-600 hover:text-green-600"
              >
                ← Volver a inicio de sesión normal
              </button>
            </form>
          ) : (
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
                  className="mt-1 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Tu contraseña"
                />
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
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

              <button
                type="button"
                onClick={() => setShowMagicLink(true)}
                className="w-full text-sm text-slate-600 hover:text-green-600"
              >
                Ingresar sin contraseña (enlace mágico)
              </button>

              <div className="pt-2 text-sm text-slate-600">
                ¿Olvidaste tu contraseña?{" "}
                <button
                  type="button"
                  onClick={() => setShowMagicLink(true)}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Recupérala aquí
                </button>
              </div>

              <div className="pt-2 text-sm text-slate-600 border-t">
                ¿No tienes cuenta?{" "}
                <Link href="/registro" className="font-semibold text-blue-700 hover:underline">
                  Crear cuenta
                </Link>
              </div>
            </form>
          )}
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

