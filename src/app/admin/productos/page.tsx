import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import DeleteButton from "./DeleteButton";
import ImageCell from "./ImageCell";
import CategoryFilter from "./CategoryFilter";

type AdminProductRow = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  price_estimated: number;
  weight: number;
  is_active: boolean | null;
  discount_percent: number;
  category_name: string | null;
  brand_name: string | null;
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
};

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams?: { q?: string; categoria?: string };
}) {
  const supabase = await createClient();

  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const selectedCategory = typeof searchParams?.categoria === "string" ? searchParams.categoria.trim() : "";

  // Fetch categories
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id,name,slug")
    .order("name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError.message);
  }

  const categories = (categoriesData ?? []) as CategoryRow[];

  // Query productos con filtro por categoría
  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      image_url,
      price_estimated,
      weight,
      is_active,
      discount_percent,
      categories!inner(name, slug),
      brands(name)
    `)
    .order("id", { ascending: false });

  // filtro por nombre o slug
  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  // filtro por categoría usando el slug (con inner join)
  if (selectedCategory) {
    query = query.eq("categories.slug", selectedCategory);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin / Productos</h1>
        <p style={{ marginTop: 12, color: "crimson" }}>
          Error cargando productos: {error.message}
        </p>
      </div>
    );
  }

  const rows = (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image_url: p.image_url,
    price_estimated: p.price_estimated,
    weight: p.weight,
    is_active: p.is_active,
    discount_percent: p.discount_percent,
    category_name: p.categories?.[0]?.name ?? null,
    brand_name: p.brands?.[0]?.name ?? null,
  })) as AdminProductRow[];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Admin / Productos</h1>

          {/* FILTRO POR CATEGORÍA */}
          <CategoryFilter categories={categories} selectedCategory={selectedCategory} />

          {/* BUSCADOR */}
          <form action="/admin/productos" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o slug…"
              style={{
                width: 280,
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 10,
              }}
            />
            <button
              type="submit"
              title="Buscar"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              🔍
            </button>

            {q && (
              <Link href="/admin/productos" style={{ textDecoration: "underline", marginLeft: 6 }}>
                limpiar
              </Link>
            )}
          </form>

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white"
          >
            + Crear producto
          </Link>
        </div>

        <Link href="/admin" style={{ textDecoration: "underline" }}>
          ← Volver al panel
        </Link>
      </div>

      {/* ...tu tabla igual (no la toco) */}
      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ID","Imagen","Producto","Categoría","Marca","Precio (PLN)","Peso","Activo","Desc.%","Acción"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #333", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{p.id}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>
                  <ImageCell imageUrl={p.image_url} productName={p.name} />
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{p.slug}</div>
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{p.category_name ?? "-"}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{p.brand_name ?? "-"}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{Number(p.price_estimated ?? 0).toFixed(2)}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{p.weight ?? 0}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{p.is_active ? "Sí" : "No"}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>{p.discount_percent}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #222", whiteSpace: "nowrap" }}>
                  <Link href={`/admin/productos/${p.id}`} style={{ textDecoration: "underline" }}>
                    Editar →
                  </Link>
                  <DeleteButton id={p.id} />
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: "14px 12px", opacity: 0.7 }}>
                  No hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
