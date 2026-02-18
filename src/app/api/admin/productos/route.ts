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
    .select("id,name,stock_qty,price_estimated,discount_percent,is_active,category_id,category:categories(name)")
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

  // 3) Validar campos obligatorios
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const price_estimated = Number(body.price_estimated ?? body.price);
  const weight = Number(body.weight);
  const category_id = body.category_id;
  const brand_id = body.brand_id;
  const image_url = String(body.image_url || "").trim();

  const errors: string[] = [];

  if (!name) errors.push("name");
  if (!description) errors.push("description");
  if (!price_estimated || price_estimated <= 0) errors.push("price_estimated (mayor a 0)");
  if (!weight || weight <= 0) errors.push("weight (mayor a 0)");
  if (!category_id) errors.push("category_id");
  if (!brand_id) errors.push("brand_id");
  if (!image_url) errors.push("image_url");

  if (errors.length > 0) {
    return NextResponse.json(
      { error: `Faltan campos obligatorios: ${errors.join(", ")}` },
      { status: 400 }
    );
  }

  // Validar discount_percent (0-90)
  let discount_percent = Number(body.discount_percent ?? 0);
  if (discount_percent < 0 || discount_percent > 90) {
    discount_percent = 0;
  }

  // Validar discount_until
  let discount_until_raw = body.discount_until;
  let discount_until: string | null = null;
  
  if (discount_percent > 0 && discount_until_raw) {
    // Si hay descuento > 0 y viene discount_until, convertir a ISO
    const parsed = new Date(String(discount_until_raw));
    if (!isNaN(parsed.getTime())) {
      discount_until = parsed.toISOString();
    }
    // Si viene vacío como string, permitir null (descuento sin fecha)
  }
  // Si discount_percent = 0, forzar discount_until = null (independientemente de lo que venga)

  // Generar slug si no viene
  let slug = String(body.slug || "").trim();
  if (!slug && name) {
    slug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // 4) Insert con service role (evita RLS)
  const supabaseAdmin = createServiceClient();

  const has_variants = Boolean(body.has_variants);
  const variants = Array.isArray(body.variants) ? body.variants : [];

  const payload = {
    name,
    slug,
    description: description ?? null,
    price_estimated,
    weight: Math.trunc(weight),
    discount_percent: Math.trunc(discount_percent),
    discount_until,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    has_variants,
    category_id,
    brand_id,
    image_url,
  };

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(payload)
    .select("id,name,slug,description,price_estimated,weight,image_url,category_id,brand_id,is_active,has_variants,discount_percent,discount_until,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If has_variants is true and variants exist, insert them
  if (has_variants && variants.length > 0 && data?.id) {
    const productId = data.id;
    
    // Prepare variants for insertion (remove id if present, add product_id)
    const variantsToInsert = variants.map((v: any, index: number) => ({
      product_id: productId,
      label: String(v.label || "").trim(),
      amount: Number(v.amount) || 0,
      unit: String(v.unit || "g"),
      price: Number(v.price) || 0,
      is_default: index === 0, // First variant is default if none specified
      sort_order: Number(v.sort_order) || index,
      is_active: v.is_active !== false, // Default to true unless explicitly false
    }));

    // If any variant has is_default explicitly set, use that instead
    const hasExplicitDefault = variants.some((v: any) => v.is_default === true);
    if (hasExplicitDefault) {
      variantsToInsert.forEach((v: any, i: number) => {
        v.is_default = variants[i].is_default === true;
      });
    }

    // Ensure at least one variant is default
    const hasDefault = variantsToInsert.some((v: any) => v.is_default);
    if (!hasDefault && variantsToInsert.length > 0) {
      // Find first active variant to be default
      const firstActiveIndex = variantsToInsert.findIndex((v: any) => v.is_active);
      if (firstActiveIndex >= 0) {
        variantsToInsert[firstActiveIndex].is_default = true;
      } else {
        variantsToInsert[0].is_default = true;
      }
    }

    const { error: variantsError } = await supabaseAdmin
      .from("product_variants")
      .insert(variantsToInsert);

    if (variantsError) {
      console.error("Error creating variants:", variantsError);
      // Don't fail the whole request, but log the error
    }
  }

  return NextResponse.json({ data }, { status: 200 });
}
