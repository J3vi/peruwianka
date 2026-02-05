import { createClient } from '@/lib/supabase/server';
import BannersClient from './BannersClient';
import { redirect } from 'next/navigation';

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

export default async function BannersPage() {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch banners from Supabase
  const { data: bannersData, error } = await supabase
    .from('banners')
    .select('id, title, image_url, link_url, order_index, is_active, created_at')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching banners:', error.message);
  }

  const banners = (bannersData ?? []) as Banner[];

  return <BannersClient initialBanners={banners} />;
}

