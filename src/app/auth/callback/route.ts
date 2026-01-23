import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Si no hay code, vuelve al inicio
  if (!code) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Si falla aquí, normalmente es porque estás en un contexto que no permite setear cookies.
          }
        },
      },
    }
  );

  // Intercambia el code por sesión y guarda cookies
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // Da igual si hay error: redirigimos (pero si hay, mejor que lo veas en consola)
  if (error) {
    console.error("auth callback exchangeCodeForSession error:", error);
  }

  return NextResponse.redirect(new URL("/", url.origin));
}
