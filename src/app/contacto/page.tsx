'use client'

import { useMemo, useState } from "react";
import Link from "next/link";

type FormState = {
  topic: string;
  category: string;
  subcategory: string;
  orderId: string;
  message: string;
  fullName: string;
  email: string;
  phone: string;
  file: File | null;
  accept: boolean;
};

const TOPICS = [
  { value: "pedido", label: "Pedido / Entrega" },
  { value: "producto", label: "Producto / Stock" },
  { value: "pago", label: "Pago / Factura" },
  { value: "cuenta", label: "Cuenta / Acceso" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "otro", label: "Otro" },
];

const CATEGORIES: Record<string, { value: string; label: string; subs: { value: string; label: string }[] }[]> = {
  pedido: [
    { value: "estado", label: "Estado del pedido", subs: [{ value: "seguimiento", label: "Seguimiento" }, { value: "retraso", label: "Retraso" }] },
    { value: "direccion", label: "Dirección / Datos de entrega", subs: [{ value: "cambio", label: "Cambiar datos" }, { value: "error", label: "Datos incorrectos" }] },
    { value: "incidencia", label: "Incidencia", subs: [{ value: "faltante", label: "Faltante" }, { value: "dañado", label: "Producto dañado" }] },
  ],
  producto: [
    { value: "info", label: "Información del producto", subs: [{ value: "ingredientes", label: "Ingredientes" }, { value: "alergenos", label: "Alérgenos" }] },
    { value: "stock", label: "Disponibilidad", subs: [{ value: "sin_stock", label: "Sin stock" }, { value: "nuevo", label: "Recomendación" }] },
  ],
  pago: [
    { value: "metodos", label: "Métodos de pago", subs: [{ value: "blik", label: "BLIK" }, { value: "tarjeta", label: "Tarjeta" }] },
    { value: "factura", label: "Factura / Comprobante", subs: [{ value: "solicitar", label: "Solicitar" }, { value: "corregir", label: "Corregir datos" }] },
  ],
  cuenta: [
    { value: "login", label: "Inicio de sesión", subs: [{ value: "no_puedo", label: "No puedo entrar" }, { value: "correo", label: "No llega el correo" }] },
    { value: "favoritos", label: "Favoritos", subs: [{ value: "no_guarda", label: "No se guardan" }, { value: "sincronizar", label: "Sincronización" }] },
  ],
  sugerencia: [
    { value: "web", label: "Web / Experiencia", subs: [{ value: "bug", label: "Reportar bug" }, { value: "mejora", label: "Proponer mejora" }] },
  ],
  otro: [
    { value: "general", label: "Consulta general", subs: [{ value: "general", label: "General" }] },
  ],
};

export default function ContactoPage() {
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    topic: "pedido",
    category: "",
    subcategory: "",
    orderId: "",
    message: "",
    fullName: "",
    email: "",
    phone: "",
    file: null,
    accept: false,
  });

  const categoryOptions = useMemo(() => CATEGORIES[form.topic] ?? [], [form.topic]);
  const subcategoryOptions = useMemo(() => {
    const cat = categoryOptions.find(c => c.value === form.category);
    return cat?.subs ?? [];
  }, [categoryOptions, form.category]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => {
      // Si cambia topic, resetea category/subcategory
      if (key === "topic") {
        return { ...prev, topic: value as any, category: "", subcategory: "" };
      }
      // Si cambia category, resetea subcategory
      if (key === "category") {
        return { ...prev, category: value as any, subcategory: "" };
      }
      return { ...prev, [key]: value };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
  
    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setToast("Completa nombre, correo y mensaje.");
      setTimeout(() => setToast(null), 1800);
      return;
    }
  
    if (!form.accept) {
      setToast("Acepta la política de privacidad para enviar.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
  
    setSending(true);
try {
  const res = await fetch("/api/contacto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: form.topic,
      category: form.category,
      subcategory: form.subcategory,
      orderId: form.orderId,
      message: form.message,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setToast(data?.error ?? "No se pudo enviar. Intenta otra vez.");
    setTimeout(() => setToast(null), 2500);
    return;
  }

  setToast("Mensaje enviado ✅ Te responderemos lo antes posible.");
  setTimeout(() => setToast(null), 1800);

  // opcional: limpiar campos
  // setForm(initialState)
} catch (e: any) {
  setToast("Error de red. Intenta otra vez.");
  setTimeout(() => setToast(null), 2500);
} finally {
  setSending(false);
}

  }
  

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900">Contacto</h1>
        <p className="text-gray-600 mt-2">
          ¿Dudas con tu pedido, productos o tu cuenta? Escríbenos y lo resolvemos.
        </p>
      </div>

      {/* Quick actions (inspirado en “canales” + FAQ + tiendas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-2xl mb-2">💡</div>
          <h3 className="font-bold">Ayuda rápida</h3>
          <p className="text-sm text-gray-600 mt-1">
            Revisa respuestas comunes antes de escribir.
          </p>
          <Link href="/terminos" className="inline-block mt-3 text-blue-700 font-semibold hover:underline">
            Ver términos
          </Link>
          <div className="text-xs text-gray-500 mt-2">
            (Luego podemos crear /faq si quieres)
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-bold">Pedidos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Si tienes el ID del pedido, ponlo y vamos directo al grano.
          </p>
          <Link href="/cuenta" className="inline-block mt-3 text-blue-700 font-semibold hover:underline">
            Ver mi historial
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-2xl mb-2">✉️</div>
          <h3 className="font-bold">Por correo</h3>
          <p className="text-sm text-gray-600 mt-1">
            Ideal para adjuntar capturas o comprobantes.
          </p>
          <div className="mt-3 text-sm font-semibold">
            soporte@peruwianka.com
          </div>
          <div className="text-xs text-gray-500 mt-1">
            (cámbialo por tu correo real)
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-2xl mb-2">📍</div>
          <h3 className="font-bold">Puntos de entrega</h3>
          <p className="text-sm text-gray-600 mt-1">
            Próximamente: mapa/zonas de reparto.
          </p>
          <Link href="/productos" className="inline-block mt-3 text-blue-700 font-semibold hover:underline">
            Seguir comprando
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Escríbenos</h2>
          <p className="text-gray-600 mb-6">
            Te respondemos por correo. Si es por pedido, mejor con ID y detalle.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Tipo de consulta *</label>
                <select
                  value={form.topic}
                  onChange={(e) => set("topic", e.target.value)}
                  className="w-full rounded-lg border px-4 py-3"
                >
                  {TOPICS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-lg border px-4 py-3"
                >
                  <option value="">Selecciona…</option>
                  {categoryOptions.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Subcategoría</label>
                <select
                  value={form.subcategory}
                  onChange={(e) => set("subcategory", e.target.value)}
                  className="w-full rounded-lg border px-4 py-3"
                  disabled={!form.category}
                >
                  <option value="">{form.category ? "Elige…" : "Primero elige categoría"}</option>
                  {subcategoryOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">ID de pedido (opcional)</label>
                <input
                  value={form.orderId}
                  onChange={(e) => set("orderId", e.target.value)}
                  placeholder="Ej: 2e6183f5-…"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Mensaje *</label>
              <textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Cuéntanos qué pasó (si puedes, incluye detalles y pasos)."
                className="w-full min-h-[140px] rounded-lg border px-4 py-3"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: si es un error, una captura ayuda más que 1000 insultos (aunque los entendemos).
              </p>
            </div>

            <div>
              <label className="block font-medium mb-2">Adjunto (opcional)</label>
              <input
                type="file"
                onChange={(e) => set("file", e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border px-4 py-3 bg-white"
              />
              <p className="text-xs text-gray-500 mt-2">
                Puedes adjuntar captura, comprobante, etc.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Nombre completo *</label>
                <input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Correo *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Teléfono (opcional)</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+48 …"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.accept}
                onChange={(e) => set("accept", e.target.checked)}
                className="mt-1"
              />
              <span>
                Acepto la{" "}
                <Link href="/politica-de-privacidad" className="text-blue-700 font-semibold hover:underline">
                  política de privacidad
                </Link>{" "}
                para que puedan responderme.
              </span>
            </label>

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-full bg-blue-900 text-white py-4 font-semibold hover:opacity-95 disabled:opacity-60"
            >
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        </div>

        {/* Side info (estilo “empresa + horarios + canal preferido”) */}
        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Antes de enviar</h2>

          <div className="space-y-4 text-gray-700">
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">⏱️ Tiempo de respuesta</div>
              <div className="text-sm text-gray-600">
                Normalmente respondemos en 24–48h laborables.
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">📞 Teléfono (opcional)</div>
                <div className="text-sm text-gray-600">
                Si más adelante quieres poner uno, también añade horario (como hacen las tiendas grandes).
                </div>

            </div>

            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">📎 Adjuntos</div>
                <div className="text-sm text-gray-600">
                Captura + ID de pedido = solución más rápida. (Biedronka también permite adjuntos en su formulario). 
                </div>
              </div>

            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">🔒 Privacidad</div>
              <div className="text-sm text-gray-600">
                Tus datos solo se usan para gestionar tu consulta.
              </div>
              <Link href="/politica-de-privacidad" className="inline-block mt-2 text-blue-700 font-semibold hover:underline">
                Ver política
              </Link>
            </div>
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
