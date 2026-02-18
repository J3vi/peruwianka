'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  stock_qty?: number;
}

interface TopProduct {
  name: string;
  qty: number;
}

interface RestockItem {
  id: string;
  product_id: number;
  name: string;
  qty_to_order: number;
  note: string | null;
  updated_at: string;
}

interface ReceiptItem {
  name: string;
  qty_to_order: number;
  note: string | null;
}

interface ProductRow {
  id: number;
  name: string;
  stock_qty: number;
  vendidos: number;
  qty_to_order: number;
  note: string;
}

type StockFilter = 'all' | 'noStock' | 'inStock';
type SortOrder = 'soldDesc' | 'stockAsc' | 'stockDesc';

const PAGE_SIZE = 25;

export default function RestockPage() {
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('soldDesc');
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ id: number; message: string } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all three data sources in parallel
      const [productsRes, summaryRes, restockRes] = await Promise.all([
        fetch('/api/admin/productos?limit=1000', { cache: 'no-store' }),
        fetch(`/api/admin/orders/summary?days=${days}`, { cache: 'no-store' }),
        fetch('/api/admin/restock', { cache: 'no-store' }),
      ]);

      if (!productsRes.ok) {
        if (productsRes.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión como administrador.');
        }
        const errData = await productsRes.json();
        throw new Error(errData.error || `Error ${productsRes.status}: ${productsRes.statusText}`);
      }

      if (!summaryRes.ok) {
        const errData = await summaryRes.json();
        throw new Error(errData.error || `Error ${summaryRes.status}: ${summaryRes.statusText}`);
      }

      if (!restockRes.ok) {
        const errData = await restockRes.json();
        throw new Error(errData.error || `Error ${restockRes.status}: ${restockRes.statusText}`);
      }

      const productsData = await productsRes.json();
      const summaryData = await summaryRes.json();
      const restockData = await restockRes.json();

      // Create a map of top products by name for quick lookup
      const salesByName: Record<string, number> = {};
      if (summaryData.ok && summaryData.data?.topProducts) {
        summaryData.data.topProducts.forEach((p: TopProduct) => {
          salesByName[p.name] = p.qty;
        });
      }

      // Create a map of restock items by product_id
      const restockByProductId: Record<number, { qty_to_order: number; note: string }> = {};
      if (restockData.ok && restockData.data?.items) {
        restockData.data.items.forEach((item: RestockItem) => {
          restockByProductId[item.product_id] = {
            qty_to_order: item.qty_to_order,
            note: item.note || '',
          };
        });
      }

      // Combine data into product rows
      const productList: Product[] = productsData.products || [];
      const rows: ProductRow[] = productList.map((p) => ({
        id: p.id,
        name: p.name,
        stock_qty: p.stock_qty ?? 0,
        vendidos: salesByName[p.name] || 0,
        qty_to_order: restockByProductId[p.id]?.qty_to_order || 0,
        note: restockByProductId[p.id]?.note || '',
      }));

      setAllProducts(rows);
    } catch (e: any) {
      setError(e?.message || 'Error inesperado al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when days, filter, or sort changes
  useEffect(() => {
    setPage(1);
  }, [days, stockFilter, sortOrder]);

  // Apply filter and sort
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allProducts];

    // Apply stock filter
    if (stockFilter === 'noStock') {
      result = result.filter((p) => p.stock_qty === 0);
    } else if (stockFilter === 'inStock') {
      result = result.filter((p) => p.stock_qty > 0);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'soldDesc': {
          const soldA = Number(a.vendidos ?? 0);
          const soldB = Number(b.vendidos ?? 0);
          if (soldB !== soldA) return soldB - soldA;

          const stockA = Number(a.stock_qty ?? 0);
          const stockB = Number(b.stock_qty ?? 0);
          if (stockA !== stockB) return stockA - stockB;

          return String(a.name || "").localeCompare(String(b.name || ""), "es", {
            sensitivity: "base",
          });
        }

        case 'stockAsc':
          if (a.stock_qty !== b.stock_qty) {
            return a.stock_qty - b.stock_qty;
          }
          return a.name.localeCompare(b.name);
        case 'stockDesc':
          if (b.stock_qty !== a.stock_qty) {
            return b.stock_qty - a.stock_qty;
          }
          return a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [allProducts, stockFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAndSortedProducts.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedProducts, page]);

  const handleSave = async (productId: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    try {
      setSavingId(productId);
      setSaveFeedback(null);

      const res = await fetch('/api/admin/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          qty_to_order: product.qty_to_order,
          note: product.note,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error ${res.status}: ${res.statusText}`);
      }

      // Refresh restock data
      await fetchData();

      // Show feedback
      setSaveFeedback({ id: productId, message: 'Guardado' });
      setTimeout(() => setSaveFeedback(null), 2000);
    } catch (e: any) {
      setSaveFeedback({ id: productId, message: `Error: ${e?.message || 'Error al guardar'}` });
      setTimeout(() => setSaveFeedback(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  const handleGenerateReceipt = async () => {
    try {
      setReceiptLoading(true);
      const res = await fetch('/api/admin/restock/receipt', { cache: 'no-store' });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.ok && data.data?.items) {
        setReceiptItems(data.data.items);
        setShowReceiptModal(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Error al generar recibo');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleCopyReceipt = () => {
    const text = receiptItems
      .map((item) => {
        const noteText = item.note ? ` (${item.note})` : '';
        return `${item.name} - ${item.qty_to_order}${noteText}`;
      })
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('Recibo copiado al portapapeles');
    });
  };

  const updateProductField = (productId: number, field: 'qty_to_order' | 'note', value: string | number) => {
    setAllProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const periodButtons = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
  ];

  const stockFilterButtons: { label: string; value: StockFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Sin stock', value: 'noStock' },
    { label: 'Con stock', value: 'inStock' },
  ];

  const sortButtons: { label: string; value: SortOrder }[] = [
    { label: 'Vendidos ↓', value: 'soldDesc' },
    { label: 'Stock ↑', value: 'stockAsc' },
    { label: 'Stock ↓', value: 'stockDesc' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hacer pedido</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          ← Volver al panel
        </Link>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Period Selector */}
        <div className="flex gap-2">
          {periodButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setDays(btn.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                days === btn.value
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Stock Filter */}
        <div className="flex gap-2">
          {stockFilterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStockFilter(btn.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                stockFilter === btn.value
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Sort Order */}
        <div className="flex gap-2">
          {sortButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setSortOrder(btn.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                sortOrder === btn.value
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Generate Receipt Button */}
        <button
          onClick={handleGenerateReceipt}
          disabled={receiptLoading}
          className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {receiptLoading ? 'Generando...' : 'Generar recibo'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center text-gray-500">Cargando datos...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="font-medium text-red-600">Error</div>
          <div className="mt-1 text-red-500">{error}</div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 text-sm text-gray-500">
            Mostrando {paginatedProducts.length} de {filteredAndSortedProducts.length} productos
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay productos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Vendidos ({days}d)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Pedir
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Nota
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product.stock_qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product.vendidos}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="number"
                          min={0}
                          value={product.qty_to_order}
                          onChange={(e) =>
                            updateProductField(
                              product.id,
                              'qty_to_order',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-20 rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="text"
                          value={product.note}
                          onChange={(e) =>
                            updateProductField(product.id, 'note', e.target.value)
                          }
                          placeholder="Opcional"
                          className="w-32 rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(product.id)}
                            disabled={savingId === product.id}
                            className="rounded-lg bg-gray-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                          >
                            {savingId === product.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          {saveFeedback?.id === product.id && (
                            <span
                              className={`text-xs ${
                                saveFeedback.message.startsWith('Error')
                                  ? 'text-red-500'
                                  : 'text-green-600'
                              }`}
                            >
                              {saveFeedback.message}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                ← Anterior
              </button>
              <div className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold">Recibo de pedido</h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-6">
              {receiptItems.length === 0 ? (
                <div className="text-center text-gray-500">
                  No hay items para ordenar
                </div>
              ) : (
                <ul className="space-y-2">
                  {receiptItems.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-900">
                      <span className="font-medium">{item.name}</span>
                      {' - '}
                      <span className="text-blue-600">{item.qty_to_order}</span>
                      {item.note && (
                        <span className="text-gray-500"> ({item.note})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-500">
                Total: {receiptItems.length} productos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyReceipt}
                  disabled={receiptItems.length === 0}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  Copiar
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
