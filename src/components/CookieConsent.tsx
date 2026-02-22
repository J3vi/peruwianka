"use client";

import { useEffect, useState } from "react";

const KEY = "peruwianka_cookie_consent_v1";

type ConsentValue = "all" | "essential" | "rejected";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) setOpen(true);
    } catch {
      // si localStorage falla, no rompemos la app
      setOpen(true);
    }
  }, []);

  const save = (value: ConsentValue) => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        value,
        ts: Date.now(),
        analytics: value === "all",
        marketing: value === "all",
        essential: value !== "rejected", // “rechazar” = sin extras; essential siempre se asume necesaria
      })
    );

    window.dispatchEvent(new CustomEvent("consent:changed"));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999]">
      <div className="mx-auto max-w-4xl p-3">
        <div className="rounded-2xl border bg-white/95 backdrop-blur shadow-lg p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-neutral-800">
              <p className="font-semibold">Cookies y privacidad</p>
              <p className="mt-1 text-neutral-700">
                Usamos cookies para que la web funcione y, si aceptas, para medir
                y mejorar la experiencia (analítica/marketing). Puedes aceptar
                todo, rechazar o quedarte solo con lo esencial.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <button
                onClick={() => save("essential")}
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                Solo lo necesario
              </button>

              <button
                onClick={() => save("rejected")}
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                Rechazar
              </button>

              <button
                onClick={() => save("all")}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Aceptar todo
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-neutral-600">
            Puedes cambiar tu elección borrando los datos del sitio en el navegador.
          </div>
        </div>
      </div>
    </div>
  );
}