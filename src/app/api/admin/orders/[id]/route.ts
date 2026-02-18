import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const service = createServiceClient();
    const { data, error } = await service
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
        comment,
        status,
        items,
        total_estimated,
        shipping_cost,
        created_at
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json({ ok: true, data });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // 2) Parsear body
    const body = await req.json();
    const { status, comment } = body;

    // Validar status si se proporciona
    const validStatuses = ["nuevo", "preparando", "listo", "entregado", "cancelado"];
    if (status && !validStatuses.includes(status)) {
      return Response.json(
        { ok: false, error: "Estado no válido" },
        { status: 400 }
      );
    }

    // 3) Construir objeto de actualización
    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (comment !== undefined) updateData.comment = comment;

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { ok: false, error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    // 4) Actualizar usando service role
    const service = createServiceClient();
    const { data, error } = await service
      .from("orders")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json({ ok: true, data });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // 2) Eliminar usando service role
    const service = createServiceClient();
    const { error } = await service
      .from("orders")
      .delete()
      .eq("id", params.id);

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json({ ok: true, message: "Orden eliminada correctamente" });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
