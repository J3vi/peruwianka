"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.ok) {
        router.refresh();
        alert("Eliminado");
      } else {
        alert("No se pudo eliminar");
      }
    } catch {
      alert("No se pudo eliminar");
    }
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        marginLeft: 12,
        background: "crimson",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      Eliminar
    </button>
  );
}

