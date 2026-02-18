import { createServiceClient } from "@/lib/supabase/service";

interface OrderItem {
  qty: number;
  name: string;
  subtotal: number;
}

interface ProductSales {
  name: string;
  qty: number;
}

interface PeriodStats {
  ordersCount: number;
  revenueEstimated: number;
  unitsSold: number;
}

interface ChangeStats {
  delta: number;
  pct: number | null;
}

interface TimeseriesEntry {
  date: string;
  orders: number;
  revenue: number;
  units: number;
}

interface StatsResponse {
  days: number;

  current: PeriodStats;
  previous: PeriodStats;
  change: {
    ordersCount: ChangeStats;
    revenueEstimated: ChangeStats;
    unitsSold: ChangeStats;
  };
  topSold: ProductSales[];
  noMovement: ProductSales[];
  timeseries: TimeseriesEntry[];
}


function calculateChange(current: number, previous: number): ChangeStats {
  const delta = current - previous;
  let pct: number | null = null;
  
  if (previous > 0) {
    pct = (current - previous) / previous;
  } else if (previous === 0 && current > 0) {
    // Si previous es 0 y current > 0, es un aumento infinito en porcentaje
    // pero según requerimiento, devolvemos null para evitar Infinity
    pct = null;
  }
  
  return { delta, pct };
}

function calculatePeriodStats(orders: any[]): PeriodStats {
  const ordersCount = orders.length;
  
  let revenueEstimated = 0;
  orders.forEach((order) => {
    const total = Number(order.total_estimated) || 0;
    const shipping = Number(order.shipping_cost) || 0;
    revenueEstimated += total + shipping;
  });

  let unitsSold = 0;
  orders.forEach((order) => {
    const items: OrderItem[] = order.items || [];
    items.forEach((item) => {
      const qty = Number(item.qty) || 0;
      unitsSold += qty;
    });
  });

  return { ordersCount, revenueEstimated, unitsSold };
}

function calculateTimeseries(orders: any[], startDate: Date): TimeseriesEntry[] {
  const dailyStats: Record<string, { orders: number; revenue: number; units: number }> = {};

  orders.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyStats[date]) {
      dailyStats[date] = { orders: 0, revenue: 0, units: 0 };
    }
    
    dailyStats[date].orders += 1;
    
    const total = Number(order.total_estimated) || 0;
    const shipping = Number(order.shipping_cost) || 0;
    dailyStats[date].revenue += total + shipping;
    
    const items: OrderItem[] = order.items || [];
    items.forEach((item) => {
      const qty = Number(item.qty) || 0;
      dailyStats[date].units += qty;
    });
  });

  // Generate all dates from startDate to today (inclusive)
  const result: TimeseriesEntry[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const stats = dailyStats[dateStr] || { orders: 0, revenue: 0, units: 0 };
    result.push({
      date: dateStr,
      orders: stats.orders,
      revenue: stats.revenue,
      units: stats.units,
    });
  }

  return result;
}



export async function GET(req: Request) {
  try {
    // 1) Verificar usuario admin vía /api/me (EXACTO como está)
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

    // 2) Obtener parámetro days (default 30)
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, parseInt(searchParams.get("days") || "30", 10));

    // 3) Calcular fechas para current y previous periods
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);
    
    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - 2 * days);

    const previousStartISO = previousStart.toISOString();
    const currentStartISO = currentStart.toISOString();

    // 4) Service role para leer órdenes
    const service = createServiceClient();

    // 5) Traer órdenes desde previousStart (cubre ambos periodos)
    const { data: orders, error: ordersError } = await service
      .from("orders")
      .select("created_at, total_estimated, shipping_cost, items")
      .gte("created_at", previousStartISO);

    if (ordersError) {
      return Response.json({ ok: false, error: ordersError.message }, { status: 400 });
    }

    // 6) Separar órdenes en dos grupos por created_at
    const currentOrders: any[] = [];
    const previousOrders: any[] = [];

    orders?.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= currentStart) {
        currentOrders.push(order);
      } else {
        previousOrders.push(order);
      }
    });

    // 7) Calcular estadísticas para ambos periodos
    const currentStats = calculatePeriodStats(currentOrders);
    const previousStats = calculatePeriodStats(previousOrders);

    // 7.5) Calcular serie temporal solo para período CURRENT
    const timeseries = calculateTimeseries(currentOrders, currentStart);



    // 8) Calcular cambios (delta y pct)
    const change = {
      ordersCount: calculateChange(currentStats.ordersCount, previousStats.ordersCount),
      revenueEstimated: calculateChange(currentStats.revenueEstimated, previousStats.revenueEstimated),
      unitsSold: calculateChange(currentStats.unitsSold, previousStats.unitsSold),
    };

    // 9) Acumular ventas por producto SOLO para current (para topSold)
    const salesByProduct: Record<string, number> = {};
    
    currentOrders.forEach((order) => {
      const items: OrderItem[] = order.items || [];
      items.forEach((item) => {
        const qty = Number(item.qty) || 0;
        const name = item.name || "Desconocido";
        
        if (salesByProduct[name]) {
          salesByProduct[name] += qty;
        } else {
          salesByProduct[name] = qty;
        }
      });
    });

    // 10) Top 10 productos más vendidos (basado SOLO en current)
    const topSold: ProductSales[] = Object.entries(salesByProduct)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // 11) Productos sin movimiento (compara contra soldProductNames SOLO del current)
    let noMovement: ProductSales[] = [];
    
    try {
      // Obtener todos los productos
      const { data: products, error: productsError } = await service
        .from("products")
        .select("name");

      if (!productsError && products) {
        // Productos que tienen ventas en el periodo current
        const soldProductNames = new Set(Object.keys(salesByProduct));
        
        // Productos sin ventas (ordenados alfabéticamente A-Z y limitado a 10)
        noMovement = products
          .filter((product) => !soldProductNames.has(product.name))
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, 10)
          .map((product) => ({ name: product.name, qty: 0 }));
      }
    } catch {
      // Si hay error al obtener productos, devolver array vacío
      noMovement = [];
    }


    // 12) Respuesta con nueva estructura
    const responseData: StatsResponse = {
      days,
      current: currentStats,
      previous: previousStats,
      change,
      topSold,
      noMovement,
      timeseries,
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
