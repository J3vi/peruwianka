"use client";

import { useSearchParams } from "next/navigation";

export default function OfertasClient() {
  const searchParams = useSearchParams();

  // TODO: pega aquí tu lógica actual de /ofertas que usa searchParams
  // Ejemplo:
  const q = searchParams.get("q") ?? "";

  return (
    <div>
      <h1>Ofertas</h1>
      <p>q: {q}</p>
      {/* aquí va tu UI real */}
    </div>
  );
}
