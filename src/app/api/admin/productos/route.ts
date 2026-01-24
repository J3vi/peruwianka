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
    .select("id,name,price_estimated,is_active,category_id,category:categories(name)")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: products ?? [] });
}
