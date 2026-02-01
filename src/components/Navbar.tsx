'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const categories = [
  { name: 'Condimentos y Especies', slug: 'sazonadores' },
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Granos', slug: 'granos' },
  { name: 'Snacks', slug: 'snacks' },
  { name: 'Pastas y salsas', slug: 'pastas-y-salsas' },
  { name: 'Marcas', slug: 'marcas' },
];


export default function Navbar() {
  const searchParams = useSearchParams();
  const categoria = searchParams.get('categoria');

  const isTodosActive = !categoria;

  return (
    <nav className="bg-gray-100 py-4">
      <div className="w-full overflow-x-auto whitespace-nowrap px-4 sm:px-0">
        <div className="flex w-max gap-3 sm:w-full sm:justify-center">
          <Link
            href="/productos"
            className={
              "rounded-full border px-5 py-2 " +
              (isTodosActive ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-50")
            }
          >
            Todos
          </Link>
          {categories.map((c) => {
            const isActive = categoria === c.slug;

            return (
              <Link
                key={c.slug}
                href={`/productos?categoria=${c.slug}`}
                className={
                  "rounded-full border px-5 py-2 transition-colors " +
                  (isActive
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                }
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  )
}
