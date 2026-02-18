import { createServiceClient } from "@/lib/supabase/service";

interface OrderItem {
  qty: number;
  name: string;
}

interface TopProduct {
  name: string;
  qty: number;
}

interface SummaryResponse {
  days: number;
  totalUnits: number;
  topProducts: TopProduct[];
}

export async function GET(req: Request) {
  try {
    // 1) Verificar usuario admin vía /api/me (EXACTO como está en /api/admin/stats/route.ts)
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
      return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    // 2) Query param days (default 30)
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, parseInt(searchParams.get("days") || "30", 10));

    // 3) Calcular cutoffISO
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    // 4) Service role para leer órdenes
    const service = createServiceClient();

    // 5) Traer orders desde cutoffISO: select("created_at, items").gte("created_at", cutoffISO)
    const { data: orders, error: ordersError } = await service
      .from("orders")
      .select("created_at, items")
      .gte("created_at", cutoffISO);

    if (ordersError) {
      return Response.json({ ok: false, error: ordersError.message }, { status: 400 });
    }

    // 6) items es JSON array con { qty, name }
    // 7) Agrupa por name, suma qty
    const salesByProduct: Record<string, number> = {};
    let totalUnits = 0;

    orders?.forEach((order) => {
      const items: OrderItem[] = order.items || [];
      items.forEach((item) => {
        const qty = Number(item.qty) || 0;
        const name = item.name || "Desconocido";
        
        if (salesByProduct[name]) {
          salesByProduct[name] += qty;
        } else {
          salesByProduct[name] = qty;
        }
        
        totalUnits += qty;
      });
    });

    // 8) Ordena desc y devuelve topProducts (top 15)
    const topProducts: TopProduct[] = Object.entries(salesByProduct)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 15);

    // 9) Response: { ok:true, data:{ days, totalUnits, topProducts } }
    const responseData: SummaryResponse = {
      days,
      totalUnits,
      topProducts,
    };

    return Response.json({
      ok: true,
      data: responseData,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
