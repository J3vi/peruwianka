'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type OrderItem = {
  name: string;
  qty: number;
  price?: number;
  subtotal?: number;
  variant_label?: string;
};

type Order = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  city: string;
  address: string;
  comment: string | null;
  items: OrderItem[] | null;
  total_estimated: number;
  shipping_cost: number;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'preparando', label: 'Preparando' },
  { value: 'listo', label: 'Listo' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-800',
  preparando: 'bg-yellow-100 text-yellow-800',
  listo: 'bg-purple-100 text-purple-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Fecha (desc)' },
  { value: 'total_desc', label: 'Total (desc)' },
  { value: 'total_asc', label: 'Total (asc)' },
];

export default function OrdenesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at_desc');
  const [offset, setOffset] = useState(parseInt(searchParams.get('offset') || '0', 10));
  const limit = 20;

  // Estado de guardado por orden (para indicador "Guardando...")
  const [savingOrders, setSavingOrders] = useState<Record<string, boolean>>({});

  // Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar órdenes');
      }

      setOrders(data.data || []);
      setCount(data.count || 0);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, [q, status, sort, offset, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, sort]);

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (sort) params.set('sort', sort);
    if (offset > 0) params.set('offset', String(offset));
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [q, status, sort, offset, pathname, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    updateUrlParams();
    fetchOrders();
  };

  const handleStatusFilterChange = (newStatusValue: string) => {
    setStatus(newStatusValue);
    setOffset(0);
    setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (newStatusValue) params.set('status', newStatusValue);
      if (sort) params.set('sort', sort);
      params.set('limit', String(limit));
      params.set('offset', '0');
      
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 0);
  };

  const handleSortChange = (newSortValue: string) => {
    setSort(newSortValue);
    setOffset(0);
    setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (newSortValue) params.set('sort', newSortValue);
      params.set('limit', String(limit));
      params.set('offset', '0');
      
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 0);
  };

  // Cambio de estado inline en la tabla (optimista)
  const handleStatusChangeInline = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;

    const oldStatus = order.status;

    // Actualización optimista
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    setSavingOrders(prev => ({ ...prev, [orderId]: true }));

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar');
      }
    } catch (err: any) {
      // Revertir en caso de error
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: oldStatus } : o
      ));
      alert(err.message || 'Error al guardar el estado');
    } finally {
      setSavingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handlePrevious = () => {
    const newOffset = Math.max(0, offset - limit);
    setOffset(newOffset);
    setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (sort) params.set('sort', sort);
      if (newOffset > 0) params.set('offset', String(newOffset));
      params.set('limit', String(limit));
      
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 0);
  };

  const handleNext = () => {
    const newOffset = offset + limit;
    if (newOffset < count) {
      setOffset(newOffset);
      setTimeout(() => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        if (sort) params.set('sort', sort);
        params.set('offset', String(newOffset));
        params.set('limit', String(limit));
        
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.push(newUrl, { scroll: false });
      }, 0);
    }
  };

  const openModal = async (orderId: string) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setSelectedOrder(null);
    setNewStatus('');
    setNewComment('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar orden');
      }

      setSelectedOrder(data.data);
      setNewStatus(data.data.status);
      setNewComment(data.data.comment || '');
    } catch (err: any) {
      alert(err.message || 'Error al cargar detalles de la orden');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setNewStatus('');
    setNewComment('');
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;

    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: newComment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar');
      }

      // Actualizar la orden en la lista
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, status: newStatus, comment: newComment }
          : o
      ));
      
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus, comment: newComment } : null);
      alert('Estado actualizado correctamente');
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar');
      }

      // Eliminar de la lista
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setCount(prev => prev - 1);
      alert('Orden eliminada correctamente');
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${Number(amount).toFixed(2)} PLN`;
  };

  const hasPrevious = offset > 0;
  const hasNext = offset + limit < count;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Órdenes</h1>
        <Link 
          href="/admin" 
          className="text-blue-600 hover:underline"
        >
          ← Volver al panel
        </Link>
      </div>

      {/* Barra superior: filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono"
            className="w-64 rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Buscar
          </button>
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                setOffset(0);
                setTimeout(() => fetchOrders(), 0);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={status}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Link
          href="/admin/restock"
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          📦 Hacer pedido
        </Link>
        <button
          onClick={handleRefresh}
          className="ml-auto rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
          title="Actualizar"
        >
          🔄 Actualizar
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registrado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ciudad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay órdenes.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{order.full_name}</div>
                    <div className="text-xs text-gray-500">
                      {order.email || '—'}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      order.user_id 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.user_id ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{order.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{order.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>{formatCurrency(order.total_estimated + order.shipping_cost)}</div>
                    <div className="text-xs text-gray-500">
                      ({formatCurrency(order.total_estimated)} + {formatCurrency(order.shipping_cost)} envío)
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChangeInline(order.id, e.target.value)}
                        disabled={savingOrders[order.id]}
                        className={`rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {savingOrders[order.id] && (
                        <span className="text-xs text-gray-500">Guardando…</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(order.id)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {orders.length} de {count} órdenes
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious || loading}
            className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {Math.floor(offset / limit) + 1} de {Math.ceil(count / limit)}
          </span>
          <button
            onClick={handleNext}
            disabled={!hasNext || loading}
            className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {modalLoading ? (
              <div className="py-8 text-center">Cargando...</div>
            ) : selectedOrder ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Detalle de Orden #{selectedOrder.id.slice(0, 8)}</h2>
                  <button
                    onClick={closeModal}
                    className="rounded-lg p-2 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {/* Datos del cliente */}
                <div className="mb-6 rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Datos del Cliente</h3>
                  <div className="grid gap-2 text-sm">
                    <div><span className="font-medium">Nombre:</span> {selectedOrder.full_name}</div>
                    <div><span className="font-medium">Teléfono:</span> {selectedOrder.phone}</div>
                    <div><span className="font-medium">Ciudad:</span> {selectedOrder.city}</div>
                    <div><span className="font-medium">Dirección:</span> {selectedOrder.address}</div>
                    {selectedOrder.email && (
                      <div><span className="font-medium">Email:</span> {selectedOrder.email}</div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6 rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Productos</h3>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.variant_label && (
                              <div className="text-xs text-gray-500">{item.variant_label}</div>
                            )}
                            <div className="text-sm text-gray-600">Cantidad: {item.qty}</div>
                          </div>
                          <div className="text-right">
                            {item.subtotal !== undefined && (
                              <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                            )}
                            {item.price !== undefined && (
                              <div className="text-xs text-gray-500">{formatCurrency(item.price)} c/u</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">No hay items</div>
                  )}
                </div>

                {/* Totales */}
                <div className="mb-6 rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Totales</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.total_estimated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total_estimated + selectedOrder.shipping_cost)}</span>
                    </div>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="mb-4 rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Estado Actual</h3>
                  <div className="mb-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {/* Cambiar estado */}
                <div className="mb-6 rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Cambiar Estado</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Nuevo estado:</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Comentario (opcional):</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Notas adicionales sobre la orden..."
                      />
                    </div>
                    <button
                      onClick={handleSaveStatus}
                      disabled={savingStatus || newStatus === selectedOrder.status}
                      className="w-full rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {savingStatus ? 'Guardando...' : 'Guardar estado'}
                    </button>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewStatus('cancelado');
                    }}
                    className="flex-1 rounded-xl border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Marcar como Cancelado
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
