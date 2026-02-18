import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Configuración de paginación
const DEFAULT_LIMIT = 20;

// Mapeo de sort → orden de Supabase
const sortMap: Record<string, { col: string; asc: boolean }> = {
  name_asc: { col: "name", asc: true },
  name_desc: { col: "name", asc: false },
  price_asc: { col: "price_estimated", asc: true },
  price_desc: { col: "price_estimated", asc: false },
  newest: { col: "created_at", asc: false },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") ?? "newest";
    const offersOnly = searchParams.get("offers") === "1";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Leer query param correctamente
    const categoria = searchParams.get("categoria")?.trim() || null;

    // DEBUG LOGS API
    console.log("=== DEBUG API ===");
    console.log("API categoria =", categoria);
    // END DEBUG

    const supabase = await createClient();

    // Determinar ordenamiento
    const { col, asc } = sortMap[sort] ?? sortMap.newest;

    // Construir query base con LEFT JOIN para categories y product_variants
    let q = supabase
      .from("products")
      .select(
        "id,slug,name,price_estimated,discount_percent,discount_until,weight,image_url,is_active,has_variants,category_id,categories(name,slug),brand:brands(name,slug),product_variants(id,label,amount,unit,price,is_default,sort_order,is_active)",
        { count: "exact" }
      )

      .eq("is_active", true)
      .range(from, to)
      .order(col, { ascending: asc })
      .order("sort_order", { referencedTable: "product_variants", ascending: true })
      .order("id", { referencedTable: "product_variants", ascending: true });


    // Filtro de ofertas activas
    if (offersOnly) {
      const nowIso = new Date().toISOString();
      q = q
        .gt("discount_percent", 0)
        .or(`discount_until.is.null,discount_until.gt.${nowIso}`);
    }

    // Filtro por categoría (TESTEO: sin relaciones, usando category_id)
    if (categoria) {
      const { data: cat } = await supabase.from("categories").select("id,slug").eq("slug", categoria).single();
      console.log("API categoria =", categoria);
      console.log("CAT LOOKUP:", cat);

      if (cat?.id) {
        q = q.eq("category_id", cat.id);
      }
    } else {
      console.log("API categoria =", categoria);
      console.log("CAT LOOKUP:", null);
    }

    // Filtro por búsqueda (q - búsqueda por nombre)
    const query = searchParams.get("q");
    if (query) {
      q = q.ilike("name", `%${query}%`);
    }

    const { data: products, error, count } = await q;

    // DEBUG LOGS RESULTS
    console.log("API count =", count);
    const first3Ids = (products ?? []).slice(0, 3).map((p: any) => ({ id: p.id, name: p.name, category_id: p.category_id }));
    console.log("API first3Ids:", JSON.stringify(first3Ids));
    console.log("=== END DEBUG API ===");
    // END DEBUG

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const mapped =
      (products ?? []).map((p: any) => {
        const price = Number(p.price_estimated ?? 0);
        const discount = Number(p.discount_percent ?? 0);
        const final_price =
          discount > 0 ? +(price * (1 - discount / 100)).toFixed(2) : price;

        return { ...p, final_price };
      });

    const totalPages = Math.ceil((count ?? 0) / limit);

    return NextResponse.json({
      products: mapped,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages,
        hasMore: page < totalPages,
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
