import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import ScrollToFlash from "./ScrollToFlash";

type PageProps = { params: { id: string }; searchParams?: { error?: string; success?: string } };

export default async function AdminProductoEditPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const id = Number(params.id);

  const errorMsg = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const successMsg = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  if (!Number.isFinite(id)) {
    return (
      <div style={{ padding: 24 }}>
        <p>ID inválido.</p>
        <Link href="/admin/productos">← Volver</Link>
      </div>
    );
  }

  const { data: product, error } = await supabase
    .from("v_admin_products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Editar producto</h1>
        <p style={{ marginTop: 12, color: "crimson" }}>
          No se pudo cargar el producto: {error?.message ?? "No encontrado"}
        </p>
        <Link href="/admin/productos" style={{ textDecoration: "underline" }}>
          ← Volver
        </Link>
      </div>
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  const { data: brands } = await supabase
    .from("brands")
    .select("id,name")
    .order("name", { ascending: true });

  async function updateProduct(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const image_url = String(formData.get("image_url") ?? "").trim();

    const price_estimated = Number(formData.get("price_estimated") ?? 0);
    const weight = Number(formData.get("weight") ?? 0);
    const discount_percent = Number(formData.get("discount_percent") ?? 0);

    const is_active = formData.get("is_active") === "on";

    const category_id_raw = formData.get("category_id");
    const brand_id_raw = formData.get("brand_id");

    const category_id =
      category_id_raw && String(category_id_raw) !== "" ? Number(category_id_raw) : null;
    const brand_id =
      brand_id_raw && String(brand_id_raw) !== "" ? Number(brand_id_raw) : null;

    if (!name) {
      // No tiramos exception: redirigimos a la misma página con un estado mínimo.
      redirect(`/admin/productos/${id}?error=NAME_REQUIRED`);
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();

    if (userErr) {
      redirect(`/admin/productos/${id}?error=${encodeURIComponent("getUser error: " + userErr.message)}`);
    }

    if (!userData?.user) {
      redirect(`/admin/productos/${id}?error=${encodeURIComponent("NO_USER: server action sin sesión (cookies)")}`);
    }

    const origin = headers().get("origin") || "http://localhost:3000";

    // 1) Subir imagen si hay archivo
    let uploadedPublicUrl: string | null = null;
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const fd = new FormData();
      fd.set("file", file);

      const cookieHeader = cookies()
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");

      const upRes = await fetch(`${origin}/api/admin/productos/${id}/image`, {
        method: "POST",
        body: fd,
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });

      if (!upRes.ok) {
        const j = await upRes.json().catch(() => ({}));
        throw new Error(j?.error || "Error subiendo imagen");
      }

      const upJson = await upRes.json();
      uploadedPublicUrl = upJson.publicUrl;
    }

    // 2) luego tu PATCH normal /api/admin/productos/${id}
    const cookieHeader = cookies().toString();

    const payload: any = {
      name,
      description,
      price_estimated: Number.isFinite(price_estimated) ? price_estimated : 0,
      weight: Number.isFinite(weight) ? Math.trunc(weight) : 0,
      discount_percent: Number.isFinite(discount_percent) ? Math.trunc(discount_percent) : 0,
      is_active,
      category_id,
      brand_id,
    };

    // SOLO si tienes una URL real (subida o editada):
    if (uploadedPublicUrl && uploadedPublicUrl.startsWith("http")) {
      payload.image_url = uploadedPublicUrl;
    } else if (image_url && !image_url.includes("placehold.co")) {
      payload.image_url = image_url;
    }

    const res = await fetch(`${origin}/api/admin/productos/${id}`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg = j?.error || "Error guardando producto";
      redirect(`/admin/productos/${id}?error=${encodeURIComponent(msg)}`);
    }

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${id}`);
    redirect(`/admin/productos/${id}?success=${encodeURIComponent("Guardado con éxito")}`);
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {(errorMsg || successMsg) && <ScrollToFlash id="flash-msg" />}
      {errorMsg && (
        <div id="flash-msg" style={{ padding: 12, border: "1px solid #ff4d4f", borderRadius: 12, marginBottom: 14 }}>
          <b style={{ color: "#ff4d4f" }}>Error:</b> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div id="flash-msg" style={{ padding: 12, border: "1px solid #22c55e", borderRadius: 8, marginBottom: 16 }}>
          <b style={{ color: "#22c55e" }}>OK:</b> {successMsg}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Editar producto</h1>
        <Link href="/admin/productos" style={{ textDecoration: "underline" }}>
          ← Volver a productos
        </Link>
      </div>

      <p style={{ opacity: 0.7, marginTop: 6 }}>
        ID: <b>{product.id}</b> · Slug: <b>{product.slug}</b>
      </p>

      <form action={updateProduct} style={{ marginTop: 18, display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre *</span>
          <input
            name="name"
            defaultValue={product.name ?? ""}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Descripción</span>
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            rows={5}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Precio (PLN)</span>
            <input
              name="price_estimated"
              type="number"
              step="0.01"
              defaultValue={product.price_estimated ?? 0}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Peso</span>
            <input
              name="weight"
              type="number"
              defaultValue={product.weight ?? 0}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Descuento %</span>
            <input
              name="discount_percent"
              type="number"
              defaultValue={product.discount_percent ?? 0}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Image URL</span>
          <input
            name="image_url"
            defaultValue={product.image_url ?? ""}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
          />
        </label>

        <label style={{ display: "block", marginTop: 14, fontWeight: 600 }}>
          Subir imagen (JPG/PNG)
        </label>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg"
          style={{ marginTop: 8 }}
        />
        <p style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          Recomendado: 800×800 o 1200×1200, formato JPG o PNG.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Categoría</span>
            <select
              name="category_id"
              defaultValue={product.category_id ?? ""}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
            >
              <option value="">—</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Marca</span>
            <select
              name="brand_id"
              defaultValue={product.brand_id ?? ""}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
            >
              <option value="">—</option>
              {(brands ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <input name="is_active" type="checkbox" defaultChecked={!!product.is_active} />
          <span>Activo</span>
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #333",
              cursor: "pointer",
              fontWeight: 700,
              background: "white",
              color: "black",
            }}
          >
            Guardar cambios
          </button>

          <Link href="/admin/productos" style={{ alignSelf: "center", textDecoration: "underline" }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
