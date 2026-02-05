import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  // Cargar categorías y marcas
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  const { data: brands } = await supabase
    .from("brands")
    .select("id,name")
    .order("name", { ascending: true });

  async function createProduct(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const weight = Number(formData.get("weight") ?? 0);
    const discount_percent = Number(formData.get("discount_percent") ?? 0);
    const category_id_raw = formData.get("category_id");
    const brand_id_raw = formData.get("brand_id");
    const image_url = String(formData.get("image_url") ?? "").trim();
    const file = formData.get("file");

    // Validar campos obligatorios básicos
    const errors: string[] = [];
    if (!name) errors.push("nombre");
    if (!description) errors.push("descripción");
    if (!price || price <= 0) errors.push("precio (mayor a 0)");
    if (!weight || weight <= 0) errors.push("peso (mayor a 0)");
    if (!category_id_raw || String(category_id_raw) === "") errors.push("categoría");
    if (!brand_id_raw || String(brand_id_raw) === "") errors.push("marca");

    const category_id = Number(category_id_raw);
    const brand_id = Number(brand_id_raw);

    // Validar imagen
    const hasFile = file instanceof File && file.size > 0;
    const hasImageUrl = image_url.startsWith("http");

    if (!hasFile && !hasImageUrl) {
      redirect(
        `/admin/productos/nuevo?error=${encodeURIComponent(
          "Sube una imagen o pega una URL"
        )}`
      );
    }

    if (errors.length > 0) {
      redirect(
        `/admin/productos/nuevo?error=${encodeURIComponent(
          `Faltan campos: ${errors.join(", ")}`
        )}`
      );
    }

    // Validar discount_percent (0-90)
    let discount = discount_percent;
    if (discount < 0 || discount > 90) {
      discount = 0;
    }

    const origin = headers().get("origin") ?? "http://localhost:3000";
    const cookieHeader = cookies()
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    let finalImageUrl = image_url;

    // Subir imagen si hay archivo
    if (hasFile) {
      const fd = new FormData();
      fd.set("file", file);

      const upRes = await fetch(`${origin}/api/admin/productos/upload`, {
        method: "POST",
        body: fd,
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });

      if (!upRes.ok) {
        const j = await upRes.json().catch(() => ({}));
        redirect(
          `/admin/productos/nuevo?error=${encodeURIComponent(
            j?.error || "Error subiendo imagen"
          )}`
        );
      }

      const upJson = await upRes.json();
      finalImageUrl = upJson.publicUrl;
    }

    // Generar slug
    let slug = String(formData.get("slug") ?? "").trim();
    if (!slug && name) {
      slug = slugify(name);
    }

    // Enviar al API
    const res = await fetch(`${origin}/api/admin/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        name,
        slug,
        description,
        price,
        weight,
        discount_percent: discount,
        category_id,
        brand_id,
        image_url: finalImageUrl,
      }),
      cache: "no-store",
    });

    const j = await res.json().catch(() => ({}));

    if (!res.ok) {
      redirect(
        `/admin/productos/nuevo?error=${encodeURIComponent(
          j?.error ?? "Error creando producto"
        )}`
      );
    }

    redirect(`/admin/productos/${j.data.id}?ok=1`);
  }

  const errorMsg =
    typeof searchParams.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Crear producto</h1>

      {errorMsg && (
        <div
          style={{
            color: "red",
            marginBottom: 16,
            padding: 12,
            border: "1px solid #ff4d4f",
            borderRadius: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      <form
        action={createProduct}
        style={{ marginTop: 16, display: "grid", gap: 14 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre *</span>
          <input
            name="name"
            placeholder="Ej: Ají Amarillo"
            required
            style={{
              height: 44,
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: 12,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Slug (opcional, se genera del nombre)</span>
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

        <label style={{ display: "block", fontWeight: 600 }}>Descripción *</label>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Describe el producto..."
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Precio (PLN) *</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              style={{
                height: 44,
                padding: "0 12px",
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Peso (g) *</span>
            <input
              name="weight"
              type="number"
              min="1"
              required
              placeholder="0"
              style={{
                height: 44,
                padding: "0 12px",
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Descuento % (0-90)</span>
            <input
              name="discount_percent"
              type="number"
              min="0"
              max="90"
              defaultValue={0}
              placeholder="0"
              style={{
                height: 44,
                padding: "0 12px",
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            />
          </label>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Categoría *</span>
            <select
              name="category_id"
              required
              style={{
                height: 44,
                padding: "0 12px",
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            >
              <option value="">Seleccionar...</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Marca *</span>
            <select
              name="brand_id"
              required
              style={{
                height: 44,
                padding: "0 12px",
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            >
              <option value="">Seleccionar...</option>
              {(brands ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
          <span>URL de imagen</span>
          <input
            name="image_url"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            style={{
              height: 44,
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: 12,
            }}
          />
        </label>

        <label style={{ display: "block", marginTop: 14, fontWeight: 600 }}>
          O subir imagen (JPG/PNG)
        </label>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/jpg"
          style={{ marginTop: 8 }}
        />
        <p style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          Recomendado: 800×800 o 1200×1200, formato JPG o PNG.
        </p>

        <button
          type="submit"
          style={{
            height: 48,
            borderRadius: 12,
            border: "none",
            background: "black",
            color: "white",
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          Crear producto
        </button>
      </form>
    </div>
  );
}

