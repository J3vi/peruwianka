'use client';

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ProductFiltersProps {
  totalProducts?: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Más nuevos" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "name_desc", label: "Nombre Z-A" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
];

export default function ProductFilters({ totalProducts }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lee valores desde URL (fuente de verdad)
  const offers = searchParams?.get("offers") === "1";
  const sort = searchParams?.get("sort") ?? "newest";

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      // aplicar updates
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      });

      // SIEMPRE reset page cuando cambian filtros
      if ("offers" in updates || "sort" in updates || "categoria" in updates || "q" in updates) {
        params.set("page", "1");
      }

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  const onToggleOffers = useCallback(() => {
    const next = !offers;
    const url = buildUrl({ offers: next ? "1" : null });
    router.push(url);
  }, [offers, buildUrl, router]);

  const onChangeSort = useCallback(
    (value: string) => {
      const url = buildUrl({ sort: value === "newest" ? null : value });
      router.push(url);
    },
    [buildUrl, router]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* Ordenar por */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm font-medium text-gray-700">
          Ordenar por:
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onChangeSort(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle Solo ofertas */}
      <div className="flex items-center gap-2">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={offers}
              onChange={onToggleOffers}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF3131]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF3131]"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 ml-2">Solo ofertas</span>
        </label>
      </div>

      {/* Contador */}
      {totalProducts !== undefined && (
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {totalProducts} producto{totalProducts !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

