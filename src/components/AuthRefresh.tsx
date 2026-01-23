'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      router.refresh(); // fuerza re-render del Navbar (Server Component) con cookies nuevas
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
