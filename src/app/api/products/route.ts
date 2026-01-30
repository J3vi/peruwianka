import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET() {
  try {
    const supabase = await createClient()

    const { data: products, error } = await supabase
      .from("products")
      .select(
        "id,name,price_estimated,discount_percent,weight,image_url,is_active,category_id,category:categories(name,slug)"
      )
      .order("id", { ascending: true });

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const mapped =
      (products ?? []).map((p: any) => {
        const price = Number(p.price_estimated ?? 0);
        const discount = Number(p.discount_percent ?? 0);
        const final_price =
          discount > 0 ? +(price * (1 - discount / 100)).toFixed(2) : price;

        return { ...p, final_price };
      });

    return NextResponse.json({ products: mapped });
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
