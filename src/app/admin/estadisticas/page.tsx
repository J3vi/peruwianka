'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PeriodStats {
  ordersCount: number;
  revenueEstimated: number;
  unitsSold: number;
}

interface ChangeStats {
  delta: number;
  pct: number | null;
}

interface TimeseriesEntry {
  date: string;
  orders: number;
  revenue: number;
  units: number;
}

interface StatsData {
  days: number;
  current: PeriodStats;
  previous: PeriodStats;
  change: {
    ordersCount: ChangeStats;
    revenueEstimated: ChangeStats;
    unitsSold: ChangeStats;
  };
  topSold: Array<{ name: string; qty: number }>;
  noMovement: Array<{ name: string; qty: number }>;
  timeseries: TimeseriesEntry[];
}

type MetricType = 'revenue' | 'orders' | 'units';

function formatCurrency(amount: number) {
  return `${amount.toFixed(2)} PLN`;
}

function formatPct(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${(pct * 100).toFixed(0)}%`;
}

function getChangeColorClass(delta: number): string {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-500';
}

function formatDeltaWithSign(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getMetricLabel(metric: MetricType): string {
  switch (metric) {
    case 'revenue':
      return 'Facturación';
    case 'orders':
      return 'Pedidos';
    case 'units':
      return 'Unidades';
    default:
      return '';
  }
}

function getMetricValue(entry: TimeseriesEntry, metric: MetricType): number {
  switch (metric) {
    case 'revenue':
      return entry.revenue;
    case 'orders':
      return entry.orders;
    case 'units':
      return entry.units;
    default:
      return 0;
  }
}

function getMetricColor(metric: MetricType): string {
  switch (metric) {
    case 'revenue':
      return '#10b981'; // green-500
    case 'orders':
      return '#3b82f6'; // blue-500
    case 'units':
      return '#f59e0b'; // amber-500
    default:
      return '#6b7280';
  }
}

function formatYAxis(value: number, metric: MetricType): string {
  if (metric === 'revenue') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${Math.round(value)}`;
  }
  return `${Math.round(value)}`;
}

function getTickInterval(days: number): number {

  if (days <= 14) return 0;
  if (days <= 45) return 2;
  if (days <= 120) return 6;
  return 13;
}

interface CustomTooltipProps {

  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metric: MetricType;
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{formatDate(label || '')}</p>
        <p className="mt-1 text-lg font-bold" style={{ color: getMetricColor(metric) }}>
          {metric === 'revenue' ? formatCurrency(Number(value)) : Math.round(Number(value)).toLocaleString('es-ES')}
        </p>
      </div>
    );
  }
  return null;
}


export default function EstadisticasPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<MetricType>('revenue');

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/admin/stats?days=${days}`, {
          cache: 'no-store',
          signal,
        });
        
        if (signal.aborted) {
          return;
        }
        
        if (!res.ok) {
          if (res.status === 401) {
            setError('No autorizado. Por favor, inicia sesión como administrador.');
          } else {
            const errData = await res.json();
            setError(errData.error || `Error ${res.status}: ${res.statusText}`);
          }
          return;
        }
        
        const result = await res.json();
        
        if (signal.aborted) {
          return;
        }
        
        if (!result.ok) {
          setError(result.error || 'Error al cargar estadísticas');
          return;
        }
        
        setData(result.data);
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return;
        }
        setError(e?.message || 'Error inesperado al cargar estadísticas');
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }
    
    fetchStats();
    
    return () => {
      controller.abort();
    };
  }, [days]);

  const periodButtons = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
  ];

  const metricButtons: { label: string; value: MetricType }[] = [
    { label: 'Facturación', value: 'revenue' },
    { label: 'Pedidos', value: 'orders' },
    { label: 'Unidades', value: 'units' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estadísticas</h1>
        <Link 
          href="/admin" 
          className="text-blue-600 hover:underline"
        >
          ← Volver al panel
        </Link>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
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

      {/* Loading state */}
      {loading && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center text-gray-500">Cargando estadísticas...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="text-red-600 font-medium">Error</div>
          <div className="mt-1 text-red-500">{error}</div>
        </div>
      )}

      {/* Cards de resumen */}
      {!loading && !error && data && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Órdenes totales */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Órdenes totales ({days}d)</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {data.current.ordersCount}
            </div>
            <div className={`mt-1 text-sm font-medium ${getChangeColorClass(data.change.ordersCount.delta)}`}>
              {formatDeltaWithSign(data.change.ordersCount.delta)} ({formatPct(data.change.ordersCount.pct)})
            </div>
          </div>

          {/* Ingresos estimados */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Ingresos estimados ({days}d)</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {formatCurrency(data.current.revenueEstimated)}
            </div>
            <div className={`mt-1 text-sm font-medium ${getChangeColorClass(data.change.revenueEstimated.delta)}`}>
              {data.change.revenueEstimated.delta >= 0 ? '+' : ''}{formatCurrency(data.change.revenueEstimated.delta)} ({formatPct(data.change.revenueEstimated.pct)})
            </div>
          </div>

          {/* Productos vendidos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Productos vendidos ({days}d)</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {data.current.unitsSold}
            </div>
            <div className={`mt-1 text-sm font-medium ${getChangeColorClass(data.change.unitsSold.delta)}`}>
              {formatDeltaWithSign(data.change.unitsSold.delta)} ({formatPct(data.change.unitsSold.pct)})
            </div>
          </div>
        </div>
      )}

      {/* Sección: Evolución */}
      {!loading && !error && data && data.timeseries && data.timeseries.length > 0 && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Evolución</h2>
          
          {/* Metric Selector */}
          <div className="mb-6 flex gap-2">
            {metricButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setMetric(btn.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  metric === btn.value
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.timeseries}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={getTickInterval(days)}
                  minTickGap={24}
                  tickMargin={8}
                />

                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatYAxis(Number(v), metric)}
                />


                <Tooltip content={<CustomTooltip metric={metric} />} />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke={getMetricColor(metric)}
                  strokeWidth={3}
                  dot={{ fill: getMetricColor(metric), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sección: Más vendidos */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Más vendidos (Top 10)</h2>
        {!loading && !error && data && (
          data.topSold.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay datos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cantidad vendida</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">% del total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Barra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    const totalUnits = data.current.unitsSold;
                    const maxQtyTopSold = data.topSold[0]?.qty || 0;
                    return data.topSold.map((item, idx) => {
                      const pct = totalUnits > 0 ? Math.round((item.qty / totalUnits) * 100) : 0;
                      const barWidth = maxQtyTopSold > 0 ? (item.qty / maxQtyTopSold) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.qty}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {totalUnits > 0 ? `${pct}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="h-2 w-24 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-gray-700"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Sección: Sin movimiento */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Sin movimiento (Top 10)</h2>
        {!loading && !error && data && (
          data.noMovement.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay datos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unidades vendidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.noMovement.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

    </div>
  );
}
