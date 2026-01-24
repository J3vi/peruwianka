// src/components/Categories.tsx
import Link from "next/link";

type Category = {
  slug: string;   // NO CAMBIAR (compatibilidad)
  name: string;   // lo que se muestra
  icon: string;
};

const CATEGORIES: Category[] = [
  { slug: "sazonadores", name: "Condimentos y Especies", icon: "🍲" },
  { slug: "ajies", name: "Pastas y salsas", icon: "🌶️" },
  { slug: "granos", name: "Granos", icon: "🌽" },
  { slug: "bebidas", name: "Bebidas", icon: "🥤" },
  { slug: "snacks", name: "Snacks", icon: "🍿" },
  { slug: "marcas", name: "Marcas", icon: "🏷️" },
];

export default function Categories() {
  return (
    <section className="py-12">
     
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/productos?categoria=${encodeURIComponent(c.slug)}`}
              className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center justify-center text-center"
            >
              <div className="text-4xl mb-4">{c.icon}</div>
              <div className="font-bold text-lg leading-tight">{c.name}</div>

              {/* mini detalle visual */}
              <div className="mt-4 h-1 w-10 rounded-full bg-gray-200 group-hover:bg-green-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
