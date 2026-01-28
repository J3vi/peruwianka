import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const type = (file.type || "").toLowerCase();
    const ext =
      type === "image/png"
        ? "png"
        : type === "image/jpeg" || type === "image/jpg"
        ? "jpg"
        : null;

    if (!ext) {
      return NextResponse.json({ error: "Only JPG/PNG allowed" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const bucket = "product-images";
    const path = `products/${id}.${ext}`;

    const bytes = await file.arrayBuffer();

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, bytes, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: dbErr } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", id);

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ publicUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
