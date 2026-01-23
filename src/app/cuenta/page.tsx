'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  total_estimated: number | null;
  shipping_cost: number | null;
  items: any; // json
};

const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

export default function CuentaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const didRefresh = useRef(false);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ui
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // orders
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // session checking
  const [checking, setChecking] = useState(true);

  async function loadUserAndOrders() {
    setOrdersError(null);

    const { data: u } = await supabase.auth.getUser();
    const user = u?.user;

    if (!user) {
      setUserEmail(null);
      return;
    }

    setUserEmail(user.email ?? "Usuario");

    if (!didRefresh.current) {
      didRefresh.current = true;
      router.refresh(); // re-renderiza Server Components (Navbar) con cookies nuevas
    }

    // cargar pedidos del usuario
    setOrdersLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      setOrdersError("Sesión expirada. Inicia sesión nuevamente.");
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const res = await fetch('/api/my-orders', {
      headers: {
        authorization: `Bearer ${session.session.access_token}`
      }
    });

    if (!res.ok) {
      setOrdersError("No pude cargar tu historial.");
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const { orders } = await res.json();
    setOrders(orders);
    setOrdersLoading(false);
    console.log("ORDER SAMPLE:", orders?.[0]);
  }

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setChecking(false);
      loadUserAndOrders();
    });
    // si cambia sesión en otra pestaña, se refresca
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUserAndOrders();
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    const eClean = email.trim();
    if (!eClean || !password) {
      setToast("Completa tu correo y contraseña.");
      setTimeout(() => setToast(null), 1800);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: eClean,
      password,
    });
    setLoading(false);

    if (error) {
      setToast("Correo o contraseña incorrectos.");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    setToast("Sesión iniciada ✅");
    setTimeout(() => setToast(null), 1200);
    // se recarga el estado y mostrará “Mi cuenta”
    await loadUserAndOrders();
  }

  async function onLogout() {
    await supabase.auth.signOut();
    setToast("Sesión cerrada.");
    setTimeout(() => setToast(null), 1500);
    router.push("/");
  }

  if (checking) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="bg-white rounded-2xl border p-8">Cargando…</div>
      </main>
    );
  }

  // ✅ Si hay sesión: mostrar MI CUENTA + HISTORIAL
  if (userEmail) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Mi cuenta</h1>
            <p className="text-gray-600">Sesión: {userEmail}</p>
          </div>

          <button
            onClick={onLogout}
            className="rounded-full border px-5 py-2 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* panel izquierdo */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-3">Accesos rápidos</h2>
            <div className="flex flex-col gap-2">
              <Link className="text-blue-700 hover:underline" href="/favoritos">
                Ver favoritos
              </Link>
              <Link className="text-blue-700 hover:underline" href="/carrito">
                Ir al carrito
              </Link>
              <Link className="text-blue-700 hover:underline" href="/productos">
                Seguir comprando
              </Link>
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
              Tip: tu historial se guarda cuando haces pedidos logueado.
            </div>
          </div>

          {/* historial */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">Historial de pedidos</h2>
              <button
                onClick={loadUserAndOrders}
                className="rounded-full border px-4 py-2 hover:bg-gray-50"
              >
                Actualizar
              </button>
            </div>

            {ordersLoading && (
              <p className="text-gray-600">Cargando pedidos…</p>
            )}

            {!ordersLoading && ordersError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                {ordersError}
              </div>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="rounded-lg bg-gray-50 border p-4 text-gray-700">
                Aún no tienes pedidos registrados.
              </div>
            )}

            {!ordersLoading && !ordersError && orders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">ID</th>
                      <th className="py-2">Fecha</th>
                      <th className="py-2">Estado</th>
                      <th className="py-2">Total</th>
                      <th className="text-left py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const total =
                        (o.total_estimated ?? 0) + (o.shipping_cost ?? 0);
                      return (
                        <tr key={o.id} className="border-b">
                          <td className="py-2 font-mono">
                            {String(o.id).slice(0, 8)}…
                          </td>
                          <td className="py-2">
                            {new Date(o.created_at).toLocaleString()}
                          </td>
                          <td className="py-2">{o.status ?? "—"}</td>
                          <td className="py-2 font-semibold">
                            {formatPLN(total)}
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="text-blue-700 hover:underline"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <p className="text-xs text-gray-500 mt-3">
                  *Total = subtotal estimado + envío (si aplica).
                </p>
              </div>
            )}

            {selectedOrder && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={() => setSelectedOrder(null)}
              >
                <div
                  className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="text-xl font-bold">Detalle del pedido</h2>
                      <p className="text-gray-600 text-sm">ID: {selectedOrder.id}</p>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-72px)]">
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">Estado</div>
                        <div className="font-semibold">{selectedOrder.status}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">Envío</div>
                        <div className="font-semibold">{selectedOrder.shipping_cost} zł</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">Subtotal</div>
                        <div className="font-semibold">{selectedOrder.total_estimated} zł</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border p-4">
                      <h3 className="font-semibold mb-2">Datos de entrega</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-600">Nombre:</span> {selectedOrder.full_name || "—"}</div>
                        <div><span className="text-gray-600">Teléfono:</span> {selectedOrder.phone || "—"}</div>
                        <div><span className="text-gray-600">Ciudad:</span> {selectedOrder.city || "—"}</div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-600">Dirección:</span> {selectedOrder.address || "—"}
                        </div>
                        {selectedOrder.comment ? (
                          <div className="sm:col-span-2">
                            <span className="text-gray-600">Comentario:</span> {selectedOrder.comment}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="font-semibold mb-2">Productos</div>
                      <div className="divide-y rounded-lg border">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((it: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{it.name}</div>
                                <div className="text-sm text-gray-600">
                                  {it.qty} × {it.price_estimated} zł
                                </div>
                              </div>
                              <div className="font-semibold">{it.subtotal} zł</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500">Sin items</div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-4">
                        <div className="text-gray-600 text-sm">
                          Total = subtotal + envío
                        </div>
                        <div className="text-lg font-bold">
                          {(Number(selectedOrder.total_estimated || 0) + Number(selectedOrder.shipping_cost || 0)).toFixed(2)} zł
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {toast && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-black/80 text-white px-4 py-2 shadow-lg">
            {toast}
          </div>
        )}
      </main>
    );
  }

  // ❌ Si NO hay sesión: mostrar LOGIN (igual que antes)
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="bg-white rounded-2xl border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">👤</div>
            <h1 className="text-3xl font-bold text-blue-900">Iniciar sesión</h1>
          </div>

          <form onSubmit={onLogin} className="space-y-5">
            <div>
              <label className="block font-medium mb-2">
                Dirección de correo electrónico <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Contraseña <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <Link href="/recuperar" className="inline-block text-blue-700 hover:underline">
              ¿Has olvidado la contraseña?
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-blue-900 text-white py-4 font-semibold hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>

            <div className="border-t pt-6 text-center">
              <span className="text-gray-700">¿Aún no tienes cuenta? </span>
              <Link href="/registro" className="text-blue-700 font-semibold hover:underline">
                Crear una cuenta
              </Link>
            </div>
          </form>
        </div>

        {/* RIGHT: Benefits */}
        <div className="bg-white rounded-2xl border p-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">
            Sácale más provecho a tu cuenta
          </h2>

          <ul className="space-y-5 text-lg">
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>Guarda tus favoritos y consérvalos aunque cambies de dispositivo.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>Recibe avisos de promociones y novedades (sin spam, palabra de peruano).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600">✓</span>
              <span>Tu historial de pedidos quedará guardado para repetir compras rápido.</span>
            </li>
          </ul>

          <div className="mt-8">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-full bg-green-600 text-white px-8 py-4 font-semibold hover:bg-green-700"
            >
              Crear una cuenta
            </Link>
            <p className="text-gray-600 mt-4">
              Solo toma un minuto y te ahorra dolores de cabeza después.
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-black/80 text-white px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
