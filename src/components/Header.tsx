'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import CartDropdown from "@/components/CartDropdown";
import { User as UserIcon } from "lucide-react";
import Image from "next/image";


// OJO: esta ruta la saco de tu estructura (src/lib/supabase/ts/client.ts)
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type HeaderUser = {
  id: string;
  email?: string | null;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<
    { id: number; name: string; price_estimated: number; image_url: string }[]
  >([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    let mounted = true;

    // 1) Estado inicial
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data?.user) setUser(null);
      else setUser({ id: data.user.id, email: data.user.email });
    });

    // 2) Cambios en vivo (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email } : null);

      // esto fuerza a que Server Components / layouts refresquen si los usas
      router.refresh();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const debounce = useCallback((fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  }, []);

  const fetchSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setProducts([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
        setProducts(data.products);
        setOpen(data.suggestions.length > 0 || data.products.length > 0);
      } else {
        setSuggestions([]);
        setProducts([]);
        setOpen(false);
      }
    } catch (error) {
      console.error(error);
      setSuggestions([]);
      setProducts([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useMemo(() => debounce(fetchSearch, 300), [fetchSearch, debounce]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    const totalItems = suggestions.length + products.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        if (highlightedIndex < suggestions.length) {
          const sugg = suggestions[highlightedIndex];
          router.push(`/productos?query=${encodeURIComponent(sugg)}`);
        } else {
          const prodIndex = highlightedIndex - suggestions.length;
          const prod = products[prodIndex];
          router.push(`/productos?query=${encodeURIComponent(prod.name)}`);
        }
        setOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, [pathname]);

  useEffect(() => {
    let alive = true;

    const fetchMe = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          if (alive) setIsAdmin(false);
          return;
        }
        const json = await res.json();
        if (alive) setIsAdmin(!!json.isAdmin);
      } catch {
        if (alive) setIsAdmin(false);
      }
    };

    // 1) carga inicial
    fetchMe();

    // 2) refresca cuando hay login/logout
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchMe();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  function onSubmitSearch(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/productos?query=${encodeURIComponent(q)}`);
    setIsAdmin(false);
  }

  async function onLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const disableMiniCartAutoOpen = pathname === "/carrito" || pathname === "/checkout";

  return (
    <div className="sticky top-0 z-50 bg-white">
      {/* Barra roja */}
      <div className="bg-red-600 text-white text-center text-sm py-2">
        <div className="mx-auto flex items-center justify-center gap-2 px-4">
        <img
  src="/image.png"
  alt=""
  className="h-11 w-11 object-contain"
/>


          <span>Envío gratis desde 220 zł</span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Peruwianka logo"
                width={600}
                height={180}
                priority
                className="h-14 w-auto sm:h-16"
              />
            </Link>
          </div>

          {/* Search */}
          <div className="w-full sm:flex-1 sm:max-w-xl sm:mx-4 min-w-0">
            <form onSubmit={onSubmitSearch} className="w-full max-w-xl">
              <div className="flex w-full">
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearch(v);
                    debouncedFetch(v);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar productos..."
                  className="w-full rounded-l-lg border border-r-0 px-4 py-2 outline-none focus:ring-2 focus:ring-red-200"
                />

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-r-lg border px-4 py-2 font-semibold hover:bg-gray-50"
                  aria-label="Buscar"
                  title="Buscar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 1 1-14 0a7 7 0 0 1 14 0Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>

              {/* Dropdown búsqueda (si lo usas) */}
              {open && (
                <div
                  ref={dropdownRef}
                  className="mt-2 rounded-lg border bg-white shadow-sm overflow-hidden"
                >
                  {loading && <div className="p-3 text-sm text-gray-500">Buscando…</div>}

                  {!loading && suggestions.length === 0 && products.length === 0 && (
                    <div className="p-3 text-sm text-gray-500">Sin resultados</div>
                  )}

                  {!loading && suggestions.length > 0 && (
                    <div className="border-b">
                      {suggestions.map((s, idx) => (
                        <button
                          key={s}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                            highlightedIndex === idx ? "bg-gray-50" : ""
                          }`}
                          onClick={() => {
                            router.push(`/productos?query=${encodeURIComponent(s)}`);
                            setOpen(false);
                            setHighlightedIndex(-1);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {!loading && products.length > 0 && (
                    <div>
                      {products.map((p, idx) => {
                        const hi = suggestions.length + idx;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                              highlightedIndex === hi ? "bg-gray-50" : ""
                            }`}
                            onClick={() => {
                              router.push(`/productos?query=${encodeURIComponent(p.name)}`);
                              setOpen(false);
                              setHighlightedIndex(-1);
                            }}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right / Icons */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/cuenta" className="flex items-center gap-2 hover:opacity-80">
                  <UserIcon className="h-5 w-5" />
                  <span className="inline text-xs sm:text-sm">Cuenta</span>
                </Link>

                <button
                  type="button"
                  onClick={onLogout}
                  className="text-sm text-gray-600 hover:text-red-600"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 hover:opacity-80">
                <UserIcon className="h-5 w-5" />
                <span className="inline text-xs sm:text-sm">Ingresar</span>
              </Link>
            )}

            <Link href="/favoritos" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
              <span className="text-lg">♡</span>
              <span className="hidden sm:inline">Favoritos</span>
            </Link>

            {isAdmin && (
              <Link href="/admin" className="font-semibold text-gray-700 hover:text-green-600">
                Admin
              </Link>
            )}

            <CartDropdown disableAutoOpen={disableMiniCartAutoOpen} />
          </div>
        </div>
      </div>
    </div>
  );
}
