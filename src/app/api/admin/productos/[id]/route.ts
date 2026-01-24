import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isAdminEmail(email: string | null | undefined) {
  const raw = process.env.ADMIN_EMAILS || "";
  const admins = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return !!email && admins.includes(email.toLowerCase());
}

type PatchBody = Partial<{
  name: string;
  slug: string;
  description: string;
  price_estimated: number;
  weight: number;
  image_url: string;
  category_id: number;
  brand_id: number;
  is_active: boolean;
}>;

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  const user = auth?.user;

  if (authError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Limpieza básica: solo campos permitidos
  const update: PatchBody = {};
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.slug === "string") update.slug = body.slug;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.price_estimated === "number") update.price_estimated = body.price_estimated;
  if (typeof body.weight === "number") update.weight = body.weight;
  if (typeof body.image_url === "string") update.image_url = body.image_url;
  if (typeof body.category_id === "number") update.category_id = body.category_id;
  if (typeof body.brand_id === "number") update.brand_id = body.brand_id;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", id)
    .select("id,name,slug,description,price_estimated,weight,image_url,category_id,brand_id,is_active,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}
