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
  const supabase = await createClient(); // ✅ ESTE era el error

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const email = user.email ?? null;

  return NextResponse.json({
    email,
    isAdmin: isAdminEmail(email),
  });
}
