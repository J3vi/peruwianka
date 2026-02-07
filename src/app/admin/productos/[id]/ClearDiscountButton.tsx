"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ClearDiscountButtonProps {
  productId: number;
  productName: string;
}

export function ClearDiscountButton({ productId, productName }: ClearDiscountButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClearDiscount = async () => {
    if (!confirm(`¿Limpiar el descuento de "${productName}"? Esto seteará discount_percent=0 y discount_until=null.`)) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/admin/productos/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discount_percent: 0,
          discount_until: null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Error al limpiar descuento");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={handleClearDiscount}
        disabled={isPending}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ff4d4f",
          background: "#fff",
          color: "#ff4d4f",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {isPending ? "Limpiando..." : "Limpiar descuento"}
      </button>
      {error && (
        <p style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

