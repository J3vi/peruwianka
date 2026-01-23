'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { createClient } from "@/lib/supabase/client";

const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

const cities = [
  'Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Gdynia', 'Sopot', 'Łódź', 'Szczecin', 'Lublin', 'Katowice', 'Bydgoszcz', 'Rzeszów', 'Białystok', 'Słupsk', 'Ustka'
];

export default function CheckoutPage() {
  const { cart, getTotal, clear } = useCart();
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    address: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (cart.length === 0) {
      setError('El carrito está vacío.');
      return;
    }

    if (!form.full_name.trim() || !form.phone.trim() || !form.city || !form.address.trim()) {
      setError('Por favor, complete todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const payload = {
        fullName: form.full_name,
        phone: form.phone,
        city: form.city,
        address: form.address,
        comment: form.comment,
        items: cart.map(item => ({ productId: item.productId, qty: item.qty }))
      };

      const res = await fetch('/api/preorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el pedido.');
      }

      setSuccess({ orderId: data.orderId });
      clear();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>Pedido enviado exitosamente. ID: {success.orderId}</p>
        </div>
        <Link href="/" className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {cart.length === 0 ? (
        <p className="text-gray-600">Tu carrito está vacío. <Link href="/productos" className="text-green-600 hover:underline">Ir a productos</Link></p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between">
                  <span>{item.name} x{item.qty}</span>
                  <span>{formatPLN(item.price_estimated * item.qty)}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-bold">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{formatPLN(getTotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío:</span>
                  <span>{getTotal() >= 220 ? 'Gratis' : formatPLN(20)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Datos de envío</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad *</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Seleccionar ciudad</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección *</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar pedido'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
