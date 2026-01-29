// src/app/ofertas/page.tsx
import { Suspense } from "react";
import OfertasClient from "./OfertasClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OfertasClient />
    </Suspense>
  );
}
