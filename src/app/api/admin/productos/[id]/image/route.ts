import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}


// POST /api/admin/productos/:id/image
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Validar tipo (solo jpg/png)
    const type = (file.type || "").toLowerCase();
    const ext =
      type === "image/jpeg" || type === "image/jpg"
        ? "jpg"
        : type === "image/png"
        ? "png"
        : null;

    if (!ext) {
      return NextResponse.json(
        { error: "Only JPG/PNG allowed" },
        { status: 400 }
      );
    }

    // Nombre fijo por producto => sobrescribe siempre (sin basura)
    const bucket = "product-images";
    const path = `products/${id}.${ext}`;

    const supabase = createServiceClient();

    // Subir con overwrite
    const bytes = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // URL pública (tu bucket es PUBLIC)
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // Guardar en DB (service role => no te choca RLS)
    const { error: dbErr } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", id);

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
