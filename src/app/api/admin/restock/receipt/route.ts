import { createServiceClient } from "@/lib/supabase/service";

interface RestockItem {
  qty_to_order: number;
  note: string | null;
  products: { name: string } | null;
}



interface ReceiptItem {
  name: string;
  qty_to_order: number;
  note: string | null;
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

    // 3) Traer solo items con qty_to_order > 0, ordenados por nombre de producto
    const { data: items, error } = await service
      .from("restock_items")
      .select("qty_to_order, note, products(name)")
      .gt("qty_to_order", 0)
      .order("products(name)", { ascending: true });

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    // 4) Formatear respuesta
    const formattedItems: ReceiptItem[] = (items || []).map((item: any) => ({
      name: item.products?.name || "Desconocido",
      qty_to_order: item.qty_to_order,
      note: item.note,
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
