'use client';

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PaginationData } from "@/lib/supabase/types";

interface PaginationProps {
  pagination: PaginationData;
}

export default function Pagination({ pagination }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ calcular params SIEMPRE (sin ifs)
  const current = useMemo(() => {
    const sp = searchParams;
    return {
      page: sp.get("page") ?? "1",
    };
  }, [searchParams]);

  const createUrl = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [searchParams, pathname]
  );

  const { page, total, totalPages } = pagination;

  // No mostrar paginación si solo hay una página
  if (totalPages <= 1) {
    return null;
  }

  // Calcular rango de productos mostrados
  const startItem = (page - 1) * pagination.limit + 1;
  const endItem = Math.min(page * pagination.limit, total);

  // Generar números de página con ventana deslizante
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const windowSize = 5;
    const sideSize = 1;

    pages.push(1);

    if (page > sideSize + windowSize) {
      pages.push("ellipsis");
    }

    const leftBound = Math.max(2, page - Math.floor(windowSize / 2));
    const rightBound = Math.min(totalPages - 1, page + Math.floor(windowSize / 2));

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (page < totalPages - sideSize - windowSize + 1) {
      pages.push("ellipsis");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    router.push(createUrl(newPage));
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-4 mt-8 py-4 border-t border-gray-200">
      {/* Texto de información */}
      <p className="text-sm text-gray-600">
        Mostrando <span className="font-semibold">{startItem}</span>–<span className="font-semibold">{endItem}</span> de{" "}
        <span className="font-semibold">{total}</span> productos
      </p>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        {/* Botón Anterior */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md 
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          Anterior
        </button>

        {/* Números de página */}
        {pageNumbers.map((num, idx) =>
          num === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-3 py-2 text-gray-500 bg-white border-t border-b border-gray-300"
            >
              …
            </span>
          ) : (
            <button
              key={num}
              onClick={() => handlePageChange(num)}
              className={`px-3 py-2 text-sm font-medium border-t border-b transition-colors
                ${num === page
                  ? "bg-[#FF3131] text-white border-[#FF3131]"
                  : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              aria-label={`Página ${num}`}
              aria-current={num === page ? "page" : undefined}
            >
              {num}
            </button>
          )
        )}

        {/* Botón Siguiente */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!pagination.hasMore}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md 
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

