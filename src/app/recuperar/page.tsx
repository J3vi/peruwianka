'use client';

import Link from 'next/link';

export default function RecuperarPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Recuperar contraseña</h1>
        <p className="text-gray-600 mb-6">
          Aquí irá el envío de correo para reset. Placeholder listo.
        </p>

        <Link
          href="/cuenta"
          className="inline-flex items-center justify-center rounded-full bg-blue-900 text-white px-6 py-3 font-semibold hover:opacity-95"
        >
          Volver
        </Link>
      </div>
    </main>
  );
}
