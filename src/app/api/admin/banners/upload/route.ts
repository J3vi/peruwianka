import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Helper to check admin emails
function isAdminEmail(email: string | null | undefined): boolean {
  const raw = process.env.ADMIN_EMAILS || "";
  const admins = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && admins.includes(email.toLowerCase());
}

export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const supabaseAuth = await createClient();
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const email = authData.user.email ?? null;
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: "Acceso denegado: no es admin" }, { status: 403 });
    }

    // Parse FormData
    const form = await req.formData();
    const file = form.get("file");
    const bannerId = form.get("bannerId");
    const extParam = form.get("ext");

    // Validate required fields
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    if (!bannerId || typeof bannerId !== "string") {
      return NextResponse.json({ error: "bannerId requerido" }, { status: 400 });
    }

    // Validate file type
    const type = (file.type || "").toLowerCase();
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes PNG, JPG o WEBP" },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = typeof extParam === "string" && extParam.trim() 
      ? extParam.trim() 
      : null;
    
    if (!ext) {
      if (type === "image/jpeg" || type === "image/jpg") ext = "jpg";
      else if (type === "image/png") ext = "png";
      else if (type === "image/webp") ext = "webp";
      else {
        return NextResponse.json({ error: "Tipo de imagen no soportado" }, { status: 400 });
      }
    }

    // Upload to Supabase Storage using service role
    const serviceClient = createServiceClient();
    const path = `banners/${bannerId}.${ext}`;

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await serviceClient.storage
      .from("banners")
      .upload(path, bytes, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Error al subir imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data } = serviceClient.storage.from("banners").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

    return NextResponse.json({ ok: true, publicUrl });
  } catch (e: any) {
    console.error("Banner upload error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}

