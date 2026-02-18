import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  try {
    // 1) Verificar usuario admin vía /api/me
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

    // 2) filtros
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim() || null;
    const q = searchParams.get("q")?.trim() || null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const sort = searchParams.get("sort")?.trim() || "created_at_desc";

    // 3) service role para leer todo
    const service = createServiceClient();

    // Si q parece email (contiene @), buscar primero en profiles
    let userIdFilter: string | null = null;
    if (q && q.includes("@")) {
      const { data: profiles, error: profileError } = await service
        .from("profiles")
        .select("id")
        .eq("email", q)
        .limit(1);

      if (profileError) {
        return Response.json({ ok: false, error: profileError.message }, { status: 400 });
      }

      if (profiles && profiles.length > 0) {
        userIdFilter = profiles[0].id;
      } else {
        // No hay match en profiles, retornar lista vacía
        return Response.json({ ok: true, data: [], count: 0 });
      }
    }


    let query = service
      .from("orders")
      .select(
        `
        id,
        user_id,
        full_name,
        email,
        phone,
        city,
        address,
        status,
        total_estimated,
        shipping_cost,
        created_at
      `,
        { count: "exact" }
      );

    if (status) query = query.eq("status", status);

    if (q) {
      if (userIdFilter) {
        // Búsqueda por email de usuario registrado
        query = query.eq("user_id", userIdFilter);
      } else {
        // Búsqueda normal por full_name, email, phone
        const like = `%${q}%`;
        query = query.or(
          `full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`
        );
      }
    }

    // Aplicar ordenamiento
    switch (sort) {
      case "total_desc":
        query = query.order("total_estimated", { ascending: false });
        break;
      case "total_asc":
        query = query.order("total_estimated", { ascending: true });
        break;
      case "created_at_desc":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json({ ok: true, data, count });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
