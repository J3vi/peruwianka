import { createServiceClient } from "@/lib/supabase/service";

interface RestockItem {
  id: string;
  product_id: number;
  qty_to_order: number;
  note: string | null;
  updated_at: string;
  products: { name: string } | null;
}



interface RestockItemResponse {
  id: string;
  product_id: number;
  name: string;
  qty_to_order: number;
  note: string | null;
  updated_at: string;
}

async function checkAdmin(req: Request): Promise<boolean> {
  const origin =
    req.headers.get("x-forwarded-proto") && req.headers.get("x-forwarded-host")
      ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get(
          "x-forwarded-host"
        )}`
      : req.headers.get("origin") || "http://localhost:3000";

  const meRes = await fetch(`${origin}/api/me`, {
    headers: { cookie: req.headers.get("cookie") || "" },
    cache: "no-store",
  });

  const me = await meRes.json();

  if (!meRes.ok || me?.isAdmin !== true) {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  try {
    // 1) Verificar usuario admin vía /api/me (EXACTO como está en stats/route.ts)
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    // 2) Service role para leer restock_items
    const service = createServiceClient();

    // 3) Traer restock_items con join a products
    const { data: items, error } = await service
      .from("restock_items")
      .select("id, product_id, qty_to_order, note, updated_at, products(name)")
      .order("updated_at", { ascending: false });

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    // 4) Formatear respuesta
    const formattedItems: RestockItemResponse[] = (items || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      name: item.products?.name || "Desconocido",
      qty_to_order: item.qty_to_order,
      note: item.note,
      updated_at: item.updated_at,
    }));



    return Response.json({
      ok: true,
      data: { items: formattedItems },
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1) Verificar usuario admin vía /api/me (EXACTO como está en stats/route.ts)
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    // 2) Parsear y validar body
    const body = await req.json();
    const { product_id, qty_to_order, note } = body;

    // Validaciones
    if (!Number.isInteger(product_id) || product_id <= 0) {
      return Response.json(
        { ok: false, error: "product_id debe ser un entero mayor que 0" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(qty_to_order) || qty_to_order < 0) {
      return Response.json(
        { ok: false, error: "qty_to_order debe ser un entero mayor o igual a 0" },
        { status: 400 }
      );
    }

    // 3) Service role para upsert
    const service = createServiceClient();

    const { error } = await service
      .from("restock_items")
      .upsert(
        {
          product_id,
          qty_to_order,
          note: note || null,
        },
        { onConflict: "product_id" }
      );

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
