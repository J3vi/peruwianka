import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NuevoProductoPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  async function createProduct(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    let slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!slug && name) slug = slugify(name);

    if (!name || !slug || !description) {
      const missing = [!name ? "name" : null, !slug ? "slug" : null, !description ? "description" : null].filter(Boolean).join(", ");
      redirect(`/admin/productos/nuevo?error=${encodeURIComponent(`Faltan campos obligatorios: ${missing}`)}`);
    }

    const origin = headers().get("origin") ?? "http://localhost:3000";
    const cookieHeader = cookies()
      .getAll()
      .map(c => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${origin}/api/admin/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({ name, slug, description }),
      cache: "no-store",
    });

    const j = await res.json().catch(() => ({}));

    if (!res.ok) {
      redirect(`/admin/productos/nuevo?error=${encodeURIComponent(j?.error ?? "Error creando producto")}`);
    }

    redirect(`/admin/productos/${j.id}?ok=1`);
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Crear producto</h1>

      {searchParams.error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          {typeof searchParams.error === 'string' ? searchParams.error : 'Error desconocido'}
        </div>
      )}

      <form action={createProduct} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre *</span>
          <input
            name="name"
            placeholder="Ej: Ají Amarillo"
            style={{
              height: 44,
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: 12,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Slug (opcional)</span>
          <input
            name="slug"
            placeholder="Ej: aji-amarillo"
            style={{
              height: 44,
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: 12,
            }}
          />
        </label>

        <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>
          Descripción *
        </label>
        <textarea
          name="description"
          required
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        />

        <button
          type="submit"
          style={{
            height: 44,
            borderRadius: 12,
            border: "none",
            background: "black",
            color: "white",
            fontWeight: 700,
          }}
        >
          Crear
        </button>
      </form>
    </div>
  );
}
