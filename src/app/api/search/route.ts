import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''

    const supabase = await createClient()

    let suggestions: string[] = []
    let products: { id: number; name: string; price_estimated: number; image_url: string }[] = []

    if (q.length >= 2) {
      // Suggestions: distinct names matching query
      const { data: suggData, error: suggError } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${q}%`)
        .eq('is_active', true)
        .limit(5)

      if (suggError) {
        console.error('Error fetching suggestions:', suggError)
      } else {
        suggestions = Array.from(new Set(suggData.map(item => item.name))) // distinct
      }

      // Products: matching products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, name, price_estimated, image_url')
        .ilike('name', `%${q}%`)
        .eq('is_active', true)
        .limit(8)

      if (prodError) {
        console.error('Error fetching products:', prodError)
      } else {
        products = prodData
      }
    }

    return NextResponse.json({ suggestions, products })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
