'use client';

import { useEffect, useState } from 'react';

type ToastEventDetail = {
  message: string;
  type?: 'success' | 'error' | 'info';
};

export default function ToastHost() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [type, setType] = useState<ToastEventDetail['type']>('success');

  useEffect(() => {
    let timer: any;

    const onToast = (e: Event) => {
      const ce = e as CustomEvent<ToastEventDetail>;
      setMsg(ce.detail?.message ?? '');
      setType(ce.detail?.type ?? 'success');
      setOpen(true);

      clearTimeout(timer);
      timer = setTimeout(() => setOpen(false), 1800);
    };

    window.addEventListener('peruwianka:toast', onToast as any);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('peruwianka:toast', onToast as any);
    };
  }, []);

  if (!open) return null;

  const base =
    'fixed z-[9999] left-1/2 -translate-x-1/2 top-4 px-4 py-2 rounded-lg shadow-md text-sm font-medium';
  const style =
    type === 'error'
      ? 'bg-red-600 text-white'
      : type === 'info'
      ? 'bg-gray-900 text-white'
      : 'bg-green-600 text-white';

  return (
    <div className={`${base} ${style}`}>
      {msg}
    </div>
  );
}
