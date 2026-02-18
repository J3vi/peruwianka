'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

export default function CarritoPage() {
  const { cart, inc, dec, removeItem, getTotal } = useCart();

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Carrito</h1>
        <p className="text-gray-600">Tu carrito está vacío.</p>
        <Link href="/productos" className="text-green-600 hover:underline">
          Ir a productos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Carrito</h1>
      <div className="space-y-4">
        {cart.map((item) => (
          <div key={item.cartKey} className="flex items-center bg-white border border-gray-200 rounded-lg p-4 shadow-md">
            <div className="w-20 h-20 bg-gray-200 flex items-center justify-center mr-4">
              <Image src={item.image_url} alt={item.name} width={80} height={80} className="w-full h-full object-cover rounded" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              {item.variant_label && (
                <p className="text-gray-500 text-sm">{item.variant_label}</p>
              )}
              <p className="text-green-600 font-bold">{formatPLN(item.unit_price)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => dec(item.cartKey)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -
              </button>
              <span className="px-3 py-1 border rounded">{item.qty}</span>
              <button
                onClick={() => inc(item.cartKey)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
            </div>
            <div className="ml-4 text-right">
              <p className="font-bold">{formatPLN(item.unit_price * item.qty)}</p>
              <button
                onClick={() => removeItem(item.cartKey)}
                className="text-red-600 hover:underline text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-right">
        <p className="text-xl font-bold">Total: {formatPLN(getTotal())}</p>
        <Link href="/checkout" className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Continuar
        </Link>
      </div>
    </main>
  );
}
