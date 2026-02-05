import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const type = (file.type || "").toLowerCase();
    const ext =
      type === "image/jpeg" || type === "image/jpg"
        ? "jpg"
        : type === "image/png"
        ? "png"
        : null;

    if (!ext) {
      return NextResponse.json({ error: "Solo JPG/PNG permitidos" }, { status: 400 });
    }

    const bucket = "product-images";
    const filename = `${Date.now()}.${ext}`;
    const path = `temp/${filename}`;

    const supabase = createServiceClient();

    const bytes = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, bytes, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    return NextResponse.json({ publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}

