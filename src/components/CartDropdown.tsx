'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/hooks/useCart'

const formatPLN = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n)

export default function CartDropdown({ disableAutoOpen }: { disableAutoOpen: boolean }) {
  const { cart, getCount, getTotal } = useCart()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const total = useMemo(() => getTotal(), [getTotal])
  const count = useMemo(() => getCount(), [getCount])

  // cerrar al hacer click fuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onCartUpdate = () => {
      //if (!disableAutoOpen) {
        //setOpen(true);
        // se cierra solo a los 2 segundos
        //setTimeout(() => setOpen(false), 2000);
      //}
    };

    window.addEventListener("cart_updated", onCartUpdate);
    return () => window.removeEventListener("cart_updated", onCartUpdate);
  }, [disableAutoOpen]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
        aria-label="Carrito"
      >
        {/* icon carrito (mascota) */}
        <Image
          src="/mascota-peruwianka_cesta.png"
          alt=""
          width={26}
          height={26}
          className="h-[30px] w-[30px]"
          priority
        />

        {/* badge */}
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-black">
          {count}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          {cart.length === 0 ? (
            <div>
              <p className="text-sm text-gray-600">Tu carrito está vacío.</p>
              <Link
                href="/productos"
                className="mt-3 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                onClick={() => setOpen(false)}
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cart.slice(0, 4).map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <Image
                      src={item.image_url || '/placeholder.png'}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-md object-cover border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.qty} × {formatPLN(item.price_estimated)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 4 && (
                <p className="mt-3 text-xs text-gray-500">
                  +{cart.length - 4} más en el carrito…
                </p>
              )}

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold">Juntos:</span>
                <span className="text-sm font-bold">{formatPLN(total)}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <Link
                  href="/carrito"
                  className="rounded-lg border px-4 py-2 text-center font-semibold hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  VER CARRITO
                </Link>
                <Link
                  href="/checkout"
                  className="rounded-lg bg-yellow-400 px-4 py-2 text-center font-extrabold text-black hover:bg-yellow-300"
                  onClick={() => setOpen(false)}
                >
                  PEDIDO
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
