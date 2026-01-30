import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
export const dynamic = "force-dynamic";
export const revalidate = 0;


function isAdminEmail(email: string | null | undefined) {
  const raw = process.env.ADMIN_EMAILS || "";
  const admins = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return !!email && admins.includes(email.toLowerCase());
}

export async function GET() {
  const supabase = await createClient();

  // 1) Validar sesión
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }

  // 2) Validar admin por email
  if (!isAdminEmail(user.email ?? null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3) Traer productos + nombre de categoría (JOIN)
  // OJO: el alias "category:categories(name)" hace que te llegue { category: { name } }
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,price_estimated,discount_percent,is_active,category_id,category:categories(name)")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: products ?? [] });
}
export async function POST(request: Request) {
  const supabase = await createClient();

  // 1) Validar sesión
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const email = userData?.user?.email;

  if (userErr || !email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }

  // 2) Leer body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim();

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: name, slug" },
      { status: 400 }
    );
  }

  // 3) Insert con service role (evita RLS)
  const supabaseAdmin = createServiceClient();

  const payload = {
    name,
    slug,
    description: body.description ?? null,
    price_estimated: Number.isFinite(Number(body.price_estimated)) ? Number(body.price_estimated) : 0,
    weight: Number.isFinite(Number(body.weight)) ? Math.trunc(Number(body.weight)) : 0,
    discount_percent: Number.isFinite(Number(body.discount_percent)) ? Math.trunc(Number(body.discount_percent)) : 0,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    category_id: body.category_id ?? null,
    brand_id: body.brand_id ?? null,
    image_url: body.image_url ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(payload)
    .select("id,name,slug,description,price_estimated,weight,image_url,category_id,brand_id,is_active,discount_percent,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
